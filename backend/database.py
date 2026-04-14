"""
database.py - Supabase DB query helpers
"""
from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from config import supabase, FACE_BUCKET


# ── Users ─────────────────────────────────────────────────────────────────────

def get_user_by_email(email: str) -> Optional[Dict]:
    result = supabase.table("users").select("*").eq("email", email).execute()
    if result.data:
        return result.data[0]
    return None


def get_user_by_id(user_id: str) -> Optional[Dict]:
    result = supabase.table("users").select("*").eq("id", user_id).execute()
    if result.data:
        return result.data[0]
    return None


def get_all_users() -> List[Dict]:
    result = supabase.table("users").select("id, name, email, role, created_at").execute()
    return result.data or []


def insert_user(name: str, email: str, password_hash: str, role: str = "user") -> Dict:
    payload = {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": role,
    }
    result = supabase.table("users").insert(payload).execute()
    if result.data:
        return result.data[0]
    raise RuntimeError("Failed to insert user")


# ── Face Data ─────────────────────────────────────────────────────────────────

def insert_face_data(user_id: str, embedding_list: List[float], image_url: str) -> Dict:
    """Insert a 512-dim embedding vector into face_data."""
    payload = {
        "user_id": user_id,
        "embedding": embedding_list,   # pgvector accepts a Python list
        "image_url": image_url,
    }
    result = supabase.table("face_data").insert(payload).execute()
    if result.data:
        return result.data[0]
    raise RuntimeError("Failed to insert face data")


def get_face_data_by_user(user_id: str) -> List[Dict]:
    result = (
        supabase.table("face_data")
        .select("id, user_id, image_url, created_at")
        .eq("user_id", user_id)
        .execute()
    )
    return result.data or []


def find_closest_face(query_embedding: List[float], threshold: float = 0.75) -> Optional[Dict]:
    """
    Call the Supabase RPC function `match_face` that uses pgvector cosine similarity.
    Returns the best match {user_id, score} or None.
    """
    try:
        result = supabase.rpc(
            "match_face",
            {"query_embedding": query_embedding, "threshold": threshold},
        ).execute()
        if result.data:
            return result.data[0]
        return None
    except Exception as exc:
        raise RuntimeError(f"pgvector RPC failed: {exc}") from exc


# ── Attendance ────────────────────────────────────────────────────────────────
def _get_local_day_bounds(date_str: str) -> tuple[str, str]:
    """Return strict UTC ISO bounds for a given local YYYY-MM-DD string to bypass PostgREST URL encoding bugs."""
    import datetime as dt
    y, m, d = map(int, date_str.split('-'))
    start_local = dt.datetime.now().astimezone().replace(
        year=y, month=m, day=d, hour=0, minute=0, second=0, microsecond=0
    )
    end_local = start_local.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    start_utc = start_local.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%fZ')
    end_utc = end_local.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%fZ')
    return start_utc, end_utc


def already_marked_today(user_id: str) -> bool:
    today = date.today().isoformat()
    start_time, end_time = _get_local_day_bounds(today)
    result = (
        supabase.table("attendance")
        .select("id")
        .eq("user_id", user_id)
        .gte("created_at", start_time)
        .lte("created_at", end_time)
        .execute()
    )
    return bool(result.data)


def mark_attendance(user_id: str, confidence_score: float) -> Dict:
    payload = {
        "user_id": user_id,
        "status": "present",
        "confidence_score": confidence_score,
    }
    result = supabase.table("attendance").insert(payload).execute()
    if result.data:
        return result.data[0]
    raise RuntimeError("Failed to mark attendance")


def get_attendance(user_id: Optional[str] = None, for_date: Optional[str] = None) -> List[Dict]:
    query = supabase.table("attendance").select(
        "id, user_id, timestamp, status, confidence_score, created_at, users(name, email)"
    )
    if user_id:
        query = query.eq("user_id", user_id)
    if for_date:
        start_time, end_time = _get_local_day_bounds(for_date)
        query = query.gte("created_at", start_time).lte("created_at", end_time)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


def get_today_attendance() -> List[Dict]:
    today = date.today().isoformat()
    return get_attendance(for_date=today)


# ── Supabase Storage ──────────────────────────────────────────────────────────

def upload_face_image(file_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    """Upload image bytes to Supabase Storage and return the public URL."""
    path = f"faces/{filename}"
    supabase.storage.from_(FACE_BUCKET).upload(
        path,
        file_bytes,
        {"content-type": content_type, "upsert": "true"},
    )
    public_url = supabase.storage.from_(FACE_BUCKET).get_public_url(path)
    return public_url
