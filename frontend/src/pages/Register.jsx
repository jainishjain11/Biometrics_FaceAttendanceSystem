import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ScanFace, Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'user' })
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.role)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail
      toast.error(msg || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-hero-gradient">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-brand mb-4 mx-auto">
            <ScanFace size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-surface-400 mt-2">Join FaceAttend today</p>
        </div>

        <div className="card-glass p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <div className="relative">
                <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input id="name" type="text" required className="input pl-10"
                  placeholder="John Doe" value={form.name} onChange={set('name')} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="label">Email Address</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input id="reg-email" type="email" required className="input pl-10"
                  placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input id="reg-password" type={showPass ? 'text' : 'password'} required
                  className="input pl-10 pr-11" placeholder="Min. 6 characters"
                  value={form.password} onChange={set('password')} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="label">Role</label>
              <div className="relative">
                <ShieldCheck size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <select id="role" className="input pl-10 appearance-none"
                  value={form.role} onChange={set('role')}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Creating account…</>
              ) : (
                <><ArrowRight size={18} /> Create Account</>
              )}
            </button>
          </form>

          <div className="divider" />
          <p className="text-center text-surface-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
