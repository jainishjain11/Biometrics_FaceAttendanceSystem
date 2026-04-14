import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ScanFace, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-hero-gradient">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-brand mb-4 mx-auto">
            <ScanFace size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white glow-text">FaceAttend</h1>
          <p className="text-surface-400 mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card-glass p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input
                  id="email" type="email" required
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input
                  id="password" type={showPass ? 'text' : 'password'} required
                  className="input pl-10 pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in…</>
              ) : (
                <><ArrowRight size={18} /> Sign In</>
              )}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-surface-400 text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 text-center text-xs text-surface-500">
          Register an admin account first, then add users via the Admin Panel.
        </div>
      </div>
    </div>
  )
}
