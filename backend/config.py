"""
config.py - Environment variables and Supabase client initialization
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET: str = os.getenv("JWT_SECRET", "change_me_in_production")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

# ── Storage ───────────────────────────────────────────────────────────────────
FACE_BUCKET: str = "face-images"

# ── ML Thresholds ─────────────────────────────────────────────────────────────
FACE_MATCH_THRESHOLD: float = 0.75
EAR_THRESHOLD: float = 0.25
EAR_CONSEC_FRAMES: int = 2
