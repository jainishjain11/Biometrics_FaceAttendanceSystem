import { Eye, EyeOff, AlertCircle, CheckCircle2, Activity } from 'lucide-react'

/**
 * LivenessGuide - overlay prompt shown during liveness detection
 * Props:
 *   status: 'idle' | 'checking' | 'passed' | 'failed'
 *   blinkCount: number
 *   ear: number | null
 *   instruction: string
 */
export default function LivenessGuide({ status = 'idle', blinkCount = 0, ear = null, instruction }) {
  const configs = {
    idle: {
      icon:     <Eye size={28} className="text-surface-400" />,
      label:    'Liveness Check',
      color:    'border-surface-600/40 bg-surface-800/60',
      textColor: 'text-surface-300',
    },
    checking: {
      icon:     <Activity size={28} className="text-brand-400 animate-pulse" />,
      label:    'Verifying…',
      color:    'border-brand-500/40 bg-brand-900/20',
      textColor: 'text-brand-300',
    },
    passed: {
      icon:     <CheckCircle2 size={28} className="text-success" />,
      label:    'Liveness Confirmed ✓',
      color:    'border-success/40 bg-success/10',
      textColor: 'text-success',
    },
    failed: {
      icon:     <AlertCircle size={28} className="text-danger" />,
      label:    'Liveness Failed',
      color:    'border-danger/40 bg-danger/10',
      textColor: 'text-danger',
    },
  }

  const cfg = configs[status] || configs.idle
  const msg = instruction || {
    idle:     'Position your face in the camera frame',
    checking: 'Please blink naturally to verify you are real',
    passed:   'Great! Identity confirmed — processing…',
    failed:   'Blink not detected. Please look at the camera and blink.',
  }[status]

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 ${cfg.color}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1">
          <div className={`font-semibold text-sm mb-1 ${cfg.textColor}`}>{cfg.label}</div>
          <p className="text-surface-400 text-sm leading-relaxed">{msg}</p>

          {/* EAR + blink info */}
          {(ear !== null || blinkCount > 0) && (
            <div className="flex gap-4 mt-3">
              {blinkCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <EyeOff size={13} className="text-brand-400" />
                  <span className="text-xs text-surface-400">
                    Blinks: <span className="text-white font-medium">{blinkCount}</span>
                  </span>
                </div>
              )}
              {ear !== null && (
                <div className="flex items-center gap-1.5">
                  <Eye size={13} className="text-brand-400" />
                  <span className="text-xs text-surface-400">
                    EAR: <span className="text-white font-mono text-xs">{ear.toFixed(3)}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
