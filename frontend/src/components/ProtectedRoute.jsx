import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

/** Wrapper for protected authenticated routes */
export function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
