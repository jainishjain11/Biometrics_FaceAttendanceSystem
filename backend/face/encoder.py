"""
face/encoder.py - Extract 512-dim face embeddings using DeepFace (Facenet512)
"""
from __future__ import annotations

import base64
import io
import logging
from typing import List, Optional

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Lazy-load DeepFace so startup is fast even on machines without GPU
_deepface = None


def _get_deepface():
    global _deepface
    if _deepface is None:
        try:
            from deepface import DeepFace as _df
            _deepface = _df
        except ImportError as exc:
            raise RuntimeError("deepface is not installed. Run: pip install deepface") from exc
    return _deepface


def decode_image(data: str | bytes) -> np.ndarray:
    """
    Accept either:
      - a base64-encoded string (with or without data-URL prefix)
      - raw bytes
    Returns an OpenCV BGR ndarray.
    """
    if isinstance(data, str):
        # Strip data-URL prefix if present
        if "," in data:
            data = data.split(",", 1)[1]
        raw = base64.b64decode(data)
    else:
        raw = data

    pil_img = Image.open(io.BytesIO(raw)).convert("RGB")
    arr = np.array(pil_img)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def extract_embedding(image: np.ndarray) -> List[float]:
    """
    Use DeepFace with Facenet512 to extract a 512-dim face embedding.
    Raises ValueError when no face is found.
    """
    DeepFace = _get_deepface()
    try:
        result = DeepFace.represent(
            img_path=image,
            model_name="ArcFace",
            enforce_detection=True,
            detector_backend="opencv",
        )
        if not result:
            raise ValueError("No face detected in the image")
        # result is a list of dicts; take the first (most prominent) face
        embedding: List[float] = result[0]["embedding"]
        if len(embedding) != 512:
            raise ValueError(f"Expected 512-dim embedding, got {len(embedding)}")
        return embedding
    except Exception as exc:
        logger.warning("DeepFace embedding failed: %s", exc)
        raise ValueError(f"Face embedding extraction failed: {exc}") from exc


def extract_embedding_from_b64(b64_image: str) -> List[float]:
    """Convenience wrapper: decode base64 image → extract embedding."""
    img = decode_image(b64_image)
    return extract_embedding(img)
