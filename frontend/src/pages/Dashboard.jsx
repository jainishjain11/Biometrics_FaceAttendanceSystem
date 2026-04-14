import { useState, useEffect } from 'react'
import { Users, CheckCircle2, Clock, TrendingUp, Calendar, RefreshCw, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { attendanceAPI } from '../api/client'
import AttendanceTable from '../components/AttendanceTable'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className={`stat-icon ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm font-medium text-surface-300">{label}</div>
        {sub && <div className="text-xs text-surface-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [records, setRecords]       = useState([])
  const [todayCount, setTodayCount] = useState(0)
  const [loading, setLoading]       = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function fetchData() {
    try {
      if (isAdmin) {
        const [listRes, todayRes] = await Promise.all([
          attendanceAPI.list(dateFilter || null),
          attendanceAPI.today(),
        ])
        setRecords(listRes.data.data || [])
        setTodayCount(todayRes.data.data?.total_present || 0)
      } else {
        const res = await attendanceAPI.userList(user.id, dateFilter || null)
        setRecords(res.data.data || [])
        // count present today for own records
        const todayLocalStr = new Date().toLocaleDateString()
        setTodayCount(
          (res.data.data || []).filter(r => new Date(r.created_at).toLocaleDateString() === todayLocalStr).length
        )
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load attendance data'
      toast.error(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [dateFilter])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchData()
  }

  const totalUnique = new Set(records.map(r => r.user_id)).size
  const avgConfidence = records.length
    ? (records.reduce((s, r) => s + (r.confidence_score || 0), 0) / records.length * 100).toFixed(1)
    : 0

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">
            {isAdmin ? 'Attendance Dashboard' : 'My Attendance'}
          </h1>
          <p className="page-subtitle">
            {isAdmin
              ? `Overview of all attendance records`
              : `Welcome back, ${user?.name}`}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary gap-2 text-sm">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CheckCircle2} label="Present Today"  value={todayCount}
          iconBg="bg-success/15" iconColor="text-success" sub="Marked attendance" />
        <StatCard icon={Users}        label={isAdmin ? 'Unique Users' : 'Total Records'} 
          value={isAdmin ? totalUnique : records.length}
          iconBg="bg-brand-500/15" iconColor="text-brand-400" />
        <StatCard icon={TrendingUp}   label="Avg Confidence" value={`${avgConfidence}%`}
          iconBg="bg-info/15" iconColor="text-info" sub="Face match score" />
        <StatCard icon={Clock}        label="Total Records"  value={records.length}
          iconBg="bg-warning/15" iconColor="text-warning" sub="All time" />
      </div>

      {/* Table */}
      <div className="card p-6">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Calendar size={18} className="text-brand-400" />
            Attendance Records
          </h2>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-surface-400" />
            <input
              type="date"
              className="input py-2 text-sm w-auto"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setLoading(true) }}
            />
            {dateFilter && (
              <button
                className="btn-ghost text-sm py-2 px-3"
                onClick={() => { setDateFilter(''); setLoading(true) }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <AttendanceTable records={records} loading={loading} emptyMessage="No attendance records found" />
      </div>
    </div>
  )
}
