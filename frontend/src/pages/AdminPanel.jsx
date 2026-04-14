import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Shield, Users, UserPlus, Camera, CheckCircle2, XCircle,
  Loader2, X, Image, RefreshCw, Trash2, Search
} from 'lucide-react'
import { authAPI, faceAPI } from '../api/client'
import WebcamCapture from '../components/Webcam'
import toast from 'react-hot-toast'

export default function AdminPanel() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState(null)   // {user}
  const [capturing, setCapturing]   = useState(false)
  const [registering, setRegistering] = useState(false)
  const [capturedImg, setCapturedImg] = useState(null)
  const [userFaces, setUserFaces]   = useState({})     // userId → faces[]
  const webcamRef = useRef(null)

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await authAPI.listUsers()
      const usersData = res.data.data || []
      setUsers(usersData)
      usersData.forEach(u => loadUserFaces(u.id))
    } catch (err) {
      const detail = err.response?.data?.detail
      const errMsg = Array.isArray(detail) ? detail[0]?.msg : detail
      toast.error(errMsg || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function loadUserFaces(userId) {
    try {
      const res = await faceAPI.getUserFaces(userId)
      setUserFaces(prev => ({ ...prev, [userId]: res.data.data || [] }))
    } catch { /* silent */ }
  }

  function openModal(user) {
    setModal(user)
    setCapturedImg(null)
    setCapturing(false)
    loadUserFaces(user.id)
  }

  function closeModal() {
    setModal(null)
    setCapturedImg(null)
    setCapturing(false)
  }

  function handleCapture(img) {
    setCapturedImg(img)
    setCapturing(false)
  }

  async function registerFace() {
    if (!capturedImg || !modal) return
    setRegistering(true)
    try {
      await faceAPI.registerB64(modal.id, capturedImg)
      toast.success(`Face registered for ${modal.name}!`)
      await loadUserFaces(modal.id)
      setCapturedImg(null)
    } catch (err) {
      const detail = err.response?.data?.detail
      const errMsg = Array.isArray(detail) ? detail[0]?.msg : detail
      toast.error(errMsg || 'Face registration failed')
    } finally {
      setRegistering(false)
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield size={24} className="text-brand-400" />
            Admin Panel
          </h1>
          <p className="page-subtitle">Manage users and face registrations</p>
        </div>
        <button onClick={loadUsers} className="btn-secondary gap-2 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-icon bg-brand-500/15"><Users size={20} className="text-brand-400" /></div>
          <div><div className="text-2xl font-bold text-white">{users.length}</div><div className="text-sm text-surface-300">Total Users</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-success/15"><CheckCircle2 size={20} className="text-success" /></div>
          <div>
            <div className="text-2xl font-bold text-white">
              {Object.values(userFaces).filter(f => f.length > 0).length}
            </div>
            <div className="text-sm text-surface-300">Faces Registered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-warning/15"><Shield size={20} className="text-warning" /></div>
          <div>
            <div className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</div>
            <div className="text-sm text-surface-300">Admins</div>
          </div>
        </div>
      </div>

      {/* Search + User Table */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <h2 className="font-semibold text-white flex items-center gap-2 flex-1">
            <UserPlus size={18} className="text-brand-400" />
            Registered Users
          </h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <input
              type="text" placeholder="Search users…"
              className="input pl-9 py-2 text-sm w-56"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-12 text-surface-500">
            <Users size={36} className="mx-auto mb-3 opacity-40" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => {
              const faces = userFaces[u.id] || []
              const hasFace = faces.length > 0
              return (
                <div key={u.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/40
                             hover:bg-surface-800/70 transition-colors border border-surface-700/30">
                  <div className="w-10 h-10 rounded-full bg-brand-600/20 border border-brand-500/30
                                  flex items-center justify-center text-brand-300 font-bold flex-shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{u.name}</div>
                    <div className="text-surface-400 text-xs truncate">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge text-xs ${u.role === 'admin' ? 'badge-brand' : 'badge-success'}`}>
                      {u.role}
                    </span>
                    <span className={`badge text-xs ${hasFace ? 'badge-success' : 'badge-warning'}`}>
                      {hasFace ? `${faces.length} face${faces.length > 1 ? 's' : ''}` : 'No face'}
                    </span>
                    <button onClick={() => openModal(u)} className="btn-primary py-1.5 px-3 text-xs gap-1.5">
                      <Camera size={13} />
                      {hasFace ? 'Re-register' : 'Register Face'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Face Registration Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-slide-up">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-white text-lg">Register Face</h2>
                <p className="text-surface-400 text-sm">{modal.name} — {modal.email}</p>
              </div>
              <button onClick={closeModal} className="btn-ghost p-2 rounded-xl">
                <X size={20} />
              </button>
            </div>

            {/* Webcam or preview */}
            {!capturedImg ? (
              capturing ? (
                <div className="flex flex-col items-center gap-4">
                  <WebcamCapture
                    ref={webcamRef}
                    onCapture={handleCapture}
                    showCaptureButton={true}
                    className="w-full"
                  />
                  <button onClick={() => setCapturing(false)} className="btn-ghost text-sm">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-20 h-20 rounded-2xl bg-surface-800 border-2 border-dashed border-surface-600
                                  flex items-center justify-center">
                    <Camera size={32} className="text-surface-500" />
                  </div>
                  <p className="text-surface-400 text-sm text-center">
                    Capture a clear photo of the user's face
                  </p>
                  <button onClick={() => setCapturing(true)} className="btn-primary gap-2">
                    <Camera size={16} />
                    Open Camera
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-brand-500/40">
                  <img src={capturedImg} alt="Captured" className="w-full max-w-sm mx-auto block" />
                  <div className="absolute top-3 right-3">
                    <button onClick={() => setCapturedImg(null)} className="btn-secondary p-2 rounded-xl text-xs">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 w-full max-w-sm">
                  <button onClick={() => setCapturedImg(null)} className="btn-secondary flex-1 text-sm py-2.5">
                    Retake
                  </button>
                  <button
                    onClick={registerFace}
                    disabled={registering}
                    className="btn-primary flex-1 text-sm py-2.5 gap-2"
                  >
                    {registering
                      ? <><Loader2 size={15} className="animate-spin" /> Registering…</>
                      : <><CheckCircle2 size={15} /> Register Face</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Existing faces */}
            {userFaces[modal.id]?.length > 0 && (
              <div className="mt-6 pt-5 border-t border-surface-700/50">
                <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <Image size={15} className="text-brand-400" />
                  Registered Faces ({userFaces[modal.id].length})
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {userFaces[modal.id].map(face => (
                    <div key={face.id} className="relative group">
                      {face.image_url ? (
                        <img
                          src={face.image_url}
                          alt="Face"
                          className="w-20 h-20 rounded-xl object-cover border border-surface-600"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-surface-800 border border-surface-600
                                        flex items-center justify-center">
                          <Camera size={20} className="text-surface-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
