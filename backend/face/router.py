"""
face/router.py - Face registration and recognition endpoints
"""
from __future__ import annotations

import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

import database as db
from auth.utils import get_current_user, require_admin
from config import FACE_MATCH_THRESHOLD
from face.encoder import decode_image, extract_embedding, extract_embedding_from_b64
from face.liveness import LivenessSession, check_liveness_single_frame, check_liveness_from_b64

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/face", tags=["Face"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class RecognizeRequest(BaseModel):
    image: str                  # base64-encoded frame
    run_liveness: bool = True   # whether to enforce liveness check


class LivenessRequest(BaseModel):
    image: str                  # base64-encoded frame


# ── Face Registration ─────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_face(
    user_id: str = Form(...),
    file: Optional[UploadFile] = File(None),
    image_b64: Optional[str] = Form(None),
    _admin: dict = Depends(require_admin),
):
    """
    Admin-only. Register a face for a user.
    Accepts either a file upload or base64 string.
    """
    # 1. Decode image
    if file:
        raw_bytes = await file.read()
        bgr_image = decode_image(raw_bytes)
        content_type = file.content_type or "image/jpeg"
    elif image_b64:
        bgr_image = decode_image(image_b64)
        raw_bytes = _b64_to_bytes(image_b64)
        content_type = "image/jpeg"
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either a file upload or image_b64 field",
        )

    # 2. Extract 512-dim embedding
    try:
        embedding = extract_embedding(bgr_image)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    # 3. Upload image to Supabase Storage
    filename = f"{user_id}_{uuid.uuid4().hex}.jpg"
    try:
        image_url = db.upload_face_image(raw_bytes, filename, content_type)
    except Exception as exc:
        logger.warning("Storage upload failed, proceeding without URL: %s", exc)
        image_url = ""

    # 4. Insert embedding into face_data
    try:
        face_record = db.insert_face_data(user_id, embedding, image_url)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save face data: {exc}",
        )

    return {
        "success": True,
        "data": {"face_id": face_record["id"], "image_url": image_url},
        "message": "Face registered successfully",
    }


# ── Face Recognition + Liveness ───────────────────────────────────────────────

@router.post("/recognize")
async def recognize_face(body: RecognizeRequest):
    """
    Open endpoint (called during attendance marking).
    1. Optionally run liveness check.
    2. Extract embedding.
    3. Query pgvector for nearest match.
    4. Return matched user + confidence.
    """
    # 1. Liveness check
    liveness_result = {"is_live": True, "blink_count": 0, "ear": None}
    if body.run_liveness:
        liveness_result = check_liveness_from_b64(body.image)
        if not liveness_result["is_live"]:
            return {
                "success": False,
                "data": {
                    "is_live": False,
                    "liveness": liveness_result,
                    "matched": False,
                },
                "message": "Liveness check failed. Please blink naturally.",
            }

    # 2. Extract embedding
    try:
        embedding = extract_embedding_from_b64(body.image)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    # 3. Query pgvector
    try:
        match = db.find_closest_face(embedding, threshold=FACE_MATCH_THRESHOLD)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )

    if not match:
        return {
            "success": False,
            "data": {"matched": False, "is_live": liveness_result["is_live"]},
            "message": "Face not recognized",
        }

    # 4. Fetch user details
    user = db.get_user_by_id(str(match["user_id"]))
    user_info = {k: v for k, v in (user or {}).items() if k != "password_hash"}

    return {
        "success": True,
        "data": {
            "matched": True,
            "is_live": liveness_result["is_live"],
            "user_id": str(match["user_id"]),
            "user": user_info,
            "confidence_score": round(float(match["score"]), 4),
            "liveness": liveness_result,
        },
        "message": f"Welcome, {user_info.get('name', 'User')}!",
    }


@router.post("/liveness-check")
async def liveness_check(body: LivenessRequest):
    """Standalone liveness check endpoint (used by frontend for real-time feedback)."""
    result = check_liveness_from_b64(body.image)
    return {
        "success": True,
        "data": result,
        "message": "Blink detected — you are live!" if result["is_live"] else "Please blink to verify liveness",
    }


@router.get("/user/{user_id}")
async def get_user_faces(user_id: str, _user: dict = Depends(get_current_user)):
    faces = db.get_face_data_by_user(user_id)
    return {"success": True, "data": faces, "message": ""}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _b64_to_bytes(b64: str) -> bytes:
    import base64
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    return base64.b64decode(b64)
