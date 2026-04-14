"""
face/liveness.py - Eye Aspect Ratio (EAR) blink-based liveness detection

Uses OpenCV's face detection + facial landmarks via dlib OR a fallback
lightweight implementation when dlib is not available.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
EAR_THRESHOLD = 0.25          # below this → eye is closed
EAR_CONSEC_FRAMES = 2         # consecutive closed frames = blink


# ── dlib optional import ──────────────────────────────────────────────────────
try:
    import dlib
    _DLIB_AVAILABLE = True
except ImportError:
    _DLIB_AVAILABLE = False
    logger.warning("dlib not installed — falling back to OpenCV-based liveness")


# ── Eye landmark indices (dlib 68-point model) ────────────────────────────────
LEFT_EYE_IDX  = list(range(42, 48))   # points 42-47
RIGHT_EYE_IDX = list(range(36, 42))   # points 36-41


@dataclass
class LivenessSession:
    """Keeps rolling state for multi-frame liveness check."""
    blink_count: int = 0
    ear_below_threshold_frames: int = 0
    frame_count: int = 0
    is_live: bool = False
    ear_history: List[float] = field(default_factory=list)


# ── EAR calculation ───────────────────────────────────────────────────────────

def _eye_aspect_ratio(eye_points: np.ndarray) -> float:
    """
    EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
    eye_points shape: (6, 2)
    """
    p1, p2, p3, p4, p5, p6 = eye_points
    vertical_1 = np.linalg.norm(p2 - p6)
    vertical_2 = np.linalg.norm(p3 - p5)
    horizontal  = np.linalg.norm(p1 - p4)
    if horizontal < 1e-6:
        return 0.0
    return (vertical_1 + vertical_2) / (2.0 * horizontal)


# ── dlib-based implementation ─────────────────────────────────────────────────

_dlib_detector = None
_dlib_predictor = None

def _load_dlib(model_path: str = "shape_predictor_68_face_landmarks.dat"):
    global _dlib_detector, _dlib_predictor
    if _dlib_detector is None and _DLIB_AVAILABLE:
        try:
            _dlib_detector  = dlib.get_frontal_face_detector()  # type: ignore[attr-defined]
            _dlib_predictor = dlib.shape_predictor(model_path)  # type: ignore[attr-defined]
        except Exception as exc:
            logger.warning("Could not load dlib landmark model: %s", exc)
            _dlib_predictor = None


def _ear_from_dlib(gray: np.ndarray) -> Optional[float]:
    """Return mean EAR from both eyes using dlib, or None if no face found."""
    _load_dlib()
    if _dlib_predictor is None:
        return None
    rects = _dlib_detector(gray, 0)  # type: ignore[misc]
    if not rects:
        return None
    rect = rects[0]
    shape = _dlib_predictor(gray, rect)
    coords = np.array([[shape.part(i).x, shape.part(i).y] for i in range(68)])
    left_ear  = _eye_aspect_ratio(coords[LEFT_EYE_IDX])
    right_ear = _eye_aspect_ratio(coords[RIGHT_EYE_IDX])
    return (left_ear + right_ear) / 2.0


# ── OpenCV-based fallback ─────────────────────────────────────────────────────

_face_cascade = None
_eye_cascade  = None

def _load_opencv_cascades():
    global _face_cascade, _eye_cascade
    if _face_cascade is None:
        _face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        _eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye.xml"
        )


def _ear_from_opencv(gray: np.ndarray) -> Optional[float]:
    """
    Lightweight fallback: estimate 'openness' as ratio of detected eye height
    to face height. Not a true EAR but functional for basic liveness.
    """
    _load_opencv_cascades()
    faces = _face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(80, 80))
    if len(faces) == 0:
        return None
    x, y, w, h = faces[0]
    roi = gray[y:y+h, x:x+w]
    eyes = _eye_cascade.detectMultiScale(roi, 1.1, 10)
    if len(eyes) < 2:
        # Single or no eye detected → treat as eyes possibly closed
        return 0.18
    # Estimate EAR from bounding-box height/width ratio
    ear_values = [(ew / (eh + 1e-6)) * 0.3 for (ex, ey, ew, eh) in eyes[:2]]
    return float(np.mean(ear_values))


# ── Public API ────────────────────────────────────────────────────────────────

def compute_ear(bgr_frame: np.ndarray) -> Optional[float]:
    """Return the Eye Aspect Ratio for the first detected face."""
    gray = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2GRAY)
    if _DLIB_AVAILABLE:
        ear = _ear_from_dlib(gray)
        if ear is not None:
            return ear
    # fallback
    return _ear_from_opencv(gray)


def check_liveness_single_frame(
    bgr_frame: np.ndarray,
    session: LivenessSession,
) -> LivenessSession:
    """
    Update LivenessSession with one new frame.
    A blink is detected when EAR drops below threshold for ≥ EAR_CONSEC_FRAMES,
    then rises back above it.
    """
    session.frame_count += 1
    ear = compute_ear(bgr_frame)

    if ear is None:
        return session

    session.ear_history.append(round(ear, 4))

    if ear < EAR_THRESHOLD:
        session.ear_below_threshold_frames += 1
    else:
        if session.ear_below_threshold_frames >= EAR_CONSEC_FRAMES:
            session.blink_count += 1
        session.ear_below_threshold_frames = 0

    if session.blink_count >= 1:
        session.is_live = True

    return session


def check_liveness_from_b64(b64_frame: str) -> Dict:
    """
    Single-frame liveness check from a base64 image.
    Returns {is_live, blink_count, ear}.
    NOTE: For robust liveness, call this across multiple consecutive frames.
    """
    from face.encoder import decode_image  # avoid circular at module level
    bgr = decode_image(b64_frame)
    session = LivenessSession()
    session = check_liveness_single_frame(bgr, session)
    return {
        "is_live": session.is_live,
        "blink_count": session.blink_count,
        "ear": session.ear_history[-1] if session.ear_history else None,
    }
