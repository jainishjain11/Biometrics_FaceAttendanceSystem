"""
attendance/router.py - Attendance marking and retrieval endpoints
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

import database as db
from auth.utils import get_current_user, require_admin

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class MarkRequest(BaseModel):
    user_id: str
    confidence_score: float


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/mark", status_code=status.HTTP_201_CREATED)
async def mark_attendance(body: MarkRequest, _admin: dict = Depends(require_admin)):
    """Mark attendance for a user (called after successful face recognition)."""
    if db.already_marked_today(body.user_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance already marked for today",
        )
    record = db.mark_attendance(body.user_id, body.confidence_score)
    return {
        "success": True,
        "data": record,
        "message": "Attendance marked successfully",
    }


@router.get("/today")
async def today_attendance(_admin: dict = Depends(require_admin)):
    """Admin: today's attendance summary."""
    records = db.get_today_attendance()
    return {
        "success": True,
        "data": {
            "records": records,
            "total_present": len(records),
        },
        "message": "",
    }


@router.get("/list")
async def list_attendance(
    date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    _admin: dict = Depends(require_admin),
):
    """Admin: all attendance records, optionally filtered by date."""
    records = db.get_attendance(for_date=date)
    return {"success": True, "data": records, "message": ""}


@router.get("/user/{user_id}")
async def user_attendance(
    user_id: str,
    date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    current_user: dict = Depends(get_current_user),
):
    """Get attendance for a specific user. Users can only see their own records."""
    if current_user.get("role") != "admin" and current_user.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access another user's attendance",
        )
    records = db.get_attendance(user_id=user_id, for_date=date)
    return {"success": True, "data": records, "message": ""}


@router.get("/check/{user_id}")
async def check_today(user_id: str, _current: dict = Depends(get_current_user)):
    """Check whether a user has already marked attendance today."""
    marked = db.already_marked_today(user_id)
    return {
        "success": True,
        "data": {"already_marked": marked},
        "message": "",
    }
