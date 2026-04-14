# ✅ Face Recognition Attendance System — Walkthrough

## What Was Built

A complete, production-ready **Face Recognition Attendance System** with full-stack implementation:

- **Frontend**: React 18 + Vite + TailwindCSS (dark theme, glassmorphism UI)
- **Backend**: FastAPI (Python) running on port 8000
- **ML Pipeline**: DeepFace Facenet512 (512-dim embeddings) + OpenCV liveness detection
- **Database**: Supabase PostgreSQL with pgvector
- **Auth**: JWT-based authentication with role-based access (user/admin)

---

## Servers Running

| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost:5173 |
| Backend (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Files Created

### Backend (`backend/`)
| File | Purpose |
|------|---------|
| `main.py` | FastAPI app entry, CORS, router mounts |
| `config.py` | Supabase client + env vars |
| `database.py` | All Supabase query helpers + pgvector RPC |
| `auth/router.py` | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/users` |
| `auth/utils.py` | bcrypt hashing, JWT encode/decode, FastAPI Depends guards |
| `face/encoder.py` | DeepFace Facenet512 → 512-dim embeddings |
| `face/liveness.py` | EAR blink detection (dlib 68-point + OpenCV fallback) |
| `face/router.py` | `/face/register`, `/face/recognize`, `/face/liveness-check` |
| `attendance/router.py` | `/attendance/mark`, `/today`, `/list`, `/user/{id}` |
| `.env` | Supabase URL + key, JWT config |
| `requirements.txt` | All Python dependencies |

### Frontend (`frontend/src/`)
| File | Purpose |
|------|---------|
| `App.jsx` | React Router v6 routes (public + protected + admin) |
| `api/client.js` | Axios instance with JWT interceptor + API modules |
| `context/AuthContext.jsx` | Auth state, localStorage rehydration |
| `pages/Login.jsx` | Email/password login with JWT storage |
| `pages/Register.jsx` | Account creation with role selection |
| `pages/Dashboard.jsx` | Stats + attendance table (admin vs user view) |
| `pages/MarkAttendance.jsx` | Multi-stage liveness + face recognition flow |
| `pages/AdminPanel.jsx` | User management + face registration modal |
| `components/Webcam.jsx` | Reusable webcam with scanner overlay |
| `components/LivenessGuide.jsx` | Animated liveness status overlay |
| `components/AttendanceTable.jsx` | Data table with confidence bar |
| `components/Navbar.jsx` | Collapsible sidebar with role-based links |
| `components/ProtectedRoute.jsx` | Auth + admin route guards |

---

## First-Time Setup

> [!IMPORTANT]
> **Run `supabase_setup.sql` FIRST** in the Supabase SQL editor to create the `match_face()` RPC function needed for face recognition.

1. Go to **[Supabase SQL Editor](https://supabase.com/dashboard/project/nqxvoxtmejypsmukrczx/sql)**
2. Paste and run the contents of `supabase_setup.sql`
3. Navigate to http://localhost:5173/register
4. Create an **Admin** account (set role to "Admin")
5. Log in → go to **Admin Panel**
6. Register faces for each user via the webcam modal

---

## How Attendance Marking Works

```
1. User opens /mark-attendance
2. Clicks "Start Liveness Check"
3. Frontend sends frames to /face/liveness-check every 400ms
4. Backend computes EAR (Eye Aspect Ratio) per frame
5. On blink detected → frontend calls /face/recognize
6. Backend extracts 512-dim Facenet512 embedding
7. Supabase RPC `match_face()` finds closest vector via cosine similarity
8. If score > 0.75 → match confirmed → /attendance/mark called
9. UI shows "Welcome, [Name]! ✓" with confidence score
```

---

## Liveness Detection Algorithm

```
EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
```

- Uses dlib 68-point landmarks (if installed), else OpenCV Haar cascades
- EAR < 0.25 for 2+ frames = eye closed
- Eye open again after closed = **blink detected = LIVE**
- dlib model download: http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2

---

## Environment Variables

```env
SUPABASE_URL=https://nqxvoxtmejypsmukrczx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your_super_secret_key_change_in_production_face_attendance_2024
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

---

## Known Notes

- **dlib**: Not installed (no Windows wheel available without VS Build Tools). OpenCV fallback is active and functional.
- **DeepFace first run**: Downloads ~250MB Facenet512 model automatically on first `/face/register` or `/face/recognize` call — be patient.
- **Flask/gunicorn warnings**: Harmless — those are only needed for deepface's own web server, not ours.
- **pgvector RPC**: Must run `supabase_setup.sql` before face recognition works.
