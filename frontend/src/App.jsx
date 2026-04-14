import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login           from './pages/Login'
import Register        from './pages/Register'
import Dashboard       from './pages/Dashboard'
import MarkAttendance  from './pages/MarkAttendance'
import AdminPanel      from './pages/AdminPanel'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes — authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"       element={<Dashboard />} />
      </Route>

      {/* Admin-only routes */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/mark-attendance" element={<MarkAttendance />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Route>

      {/* Fallback */}
      <Route path="/"   element={<Navigate to="/dashboard" replace />} />
      <Route path="*"   element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
