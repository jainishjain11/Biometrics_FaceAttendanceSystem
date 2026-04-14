import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ScanFace, LayoutDashboard, UserCheck, Shield,
  LogOut, ChevronRight, Activity, Bell
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NAV_LINKS = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard',       adminOnly: false },
  { to: '/mark-attendance',  icon: UserCheck,       label: 'Mark Attendance', adminOnly: true },
  { to: '/admin',            icon: Shield,          label: 'Admin Panel',     adminOnly: true  },
]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const links = NAV_LINKS.filter(l => !l.adminOnly || isAdmin)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col
                      bg-surface-900/80 backdrop-blur-xl
                      border-r border-surface-700/40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-700/40">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-brand">
          <ScanFace size={20} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-sm leading-tight">FaceAttend</div>
          <div className="text-surface-400 text-xs">Smart Attendance</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to} className={active ? 'nav-item-active' : 'nav-item'}>
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-brand-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-surface-700/40">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-800/60 mb-2">
          <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/40
                          flex items-center justify-center text-brand-300 font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
            <div className="text-xs text-surface-400 truncate">{user?.email}</div>
          </div>
          <div className={`badge text-xs ${user?.role === 'admin' ? 'badge-brand' : 'badge-success'}`}>
            {user?.role}
          </div>
        </div>

        <button onClick={handleLogout} className="btn-ghost w-full justify-start text-danger hover:text-danger hover:bg-danger/10 rounded-xl px-3 py-2 text-sm">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
