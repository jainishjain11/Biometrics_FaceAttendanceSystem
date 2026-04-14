"""
auth/router.py - Authentication endpoints
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

import database as db
from auth.utils import (
    create_access_token,
    get_current_user,
    hash_password,
    require_admin,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"          # "user" | "admin"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    existing = db.get_user_by_email(body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    hashed = hash_password(body.password)
    user = db.insert_user(body.name, body.email, hashed, body.role)
    user.pop("password_hash", None)
    return {"success": True, "data": user, "message": "User registered successfully"}


@router.post("/login")
async def login(body: LoginRequest):
    user = db.get_user_by_email(body.email)
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token_data = {
        "sub": user["id"],
        "user_id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
    }
    token = create_access_token(token_data)
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return {
        "success": True,
        "data": {"access_token": token, "token_type": "bearer", "user": safe_user},
        "message": "Login successful",
    }


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pop("password_hash", None)
    return {"success": True, "data": user, "message": ""}


@router.get("/users")
async def list_users(_admin: dict = Depends(require_admin)):
    """Admin-only: list all users."""
    users = db.get_all_users()
    return {"success": True, "data": users, "message": ""}
