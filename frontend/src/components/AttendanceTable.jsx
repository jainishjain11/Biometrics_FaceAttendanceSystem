import { format } from 'date-fns'
import { CheckCircle2, XCircle, User, Clock } from 'lucide-react'

/**
 * AttendanceTable
 * Props:
 *   records: array of attendance records with nested users object
 *   loading: boolean
 *   emptyMessage: string
 */
export default function AttendanceTable({ records = [], loading = false, emptyMessage = 'No records found' }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!records.length) {
    return (
      <div className="text-center py-16 text-surface-500">
        <User size={40} className="mx-auto mb-3 opacity-40" />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-700/50">
            <th className="text-left py-3 px-4 text-surface-400 font-semibold uppercase text-xs tracking-wider">Name</th>
            <th className="text-left py-3 px-4 text-surface-400 font-semibold uppercase text-xs tracking-wider">Email</th>
            <th className="text-left py-3 px-4 text-surface-400 font-semibold uppercase text-xs tracking-wider">Date & Time</th>
            <th className="text-left py-3 px-4 text-surface-400 font-semibold uppercase text-xs tracking-wider">Status</th>
            <th className="text-right py-3 px-4 text-surface-400 font-semibold uppercase text-xs tracking-wider">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/30">
          {records.map((rec) => {
            const name  = rec.users?.name  || rec.user_name  || '—'
            const email = rec.users?.email || rec.user_email || '—'
            const ts    = rec.created_at ? new Date(rec.created_at) : null
            const confidence = rec.confidence_score ?? 0

            return (
              <tr key={rec.id} className="hover:bg-white/3 transition-colors group">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30
                                    flex items-center justify-center text-brand-300 text-xs font-bold flex-shrink-0">
                      {name[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-white">{name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-surface-400">{email}</td>
                <td className="py-3.5 px-4">
                  {ts ? (
                    <div className="flex items-center gap-1.5 text-surface-300">
                      <Clock size={13} className="text-surface-500" />
                      <span>{format(ts, 'MMM d, yyyy')}</span>
                      <span className="text-surface-500">·</span>
                      <span className="font-mono text-xs">{format(ts, 'HH:mm')}</span>
                    </div>
                  ) : '—'}
                </td>
                <td className="py-3.5 px-4">
                  {rec.status === 'present' ? (
                    <span className="badge-success">
                      <CheckCircle2 size={11} /> Present
                    </span>
                  ) : (
                    <span className="badge-danger">
                      <XCircle size={11} /> Absent
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-surface-300 w-10 text-right">
                      {(confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
