"""
main.py - FastAPI application entry point
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from attendance.router import router as attendance_router
from auth.router import router as auth_router
from face.router import router as face_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Face Attendance System API",
    description="Production-ready Face Recognition Attendance System with Liveness Detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(face_router)
app.include_router(attendance_router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "success": True,
        "data": {"status": "running", "version": "1.0.0"},
        "message": "Face Attendance System API is running",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"success": True, "data": {"status": "healthy"}, "message": ""}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
