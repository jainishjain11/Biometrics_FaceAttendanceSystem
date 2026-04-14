import { useState, useRef, useEffect, useCallback } from 'react'
import { ScanFace, CheckCircle2, XCircle, Loader2, Camera, RotateCcw, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { faceAPI, attendanceAPI } from '../api/client'
import WebcamCapture from '../components/Webcam'
import LivenessGuide from '../components/LivenessGuide'
import toast from 'react-hot-toast'

const STATE = {
  IDLE:        'idle',
  LIVENESS:    'checking',
  PROCESSING:  'processing',
  SUCCESS:      'success',
  FAIL_LIVE:   'fail_live',
  FAIL_FACE:   'fail_face',
  ALREADY:     'already',
}

export default function MarkAttendance() {
  const { user } = useAuth()
  const webcamRef  = useRef(null)
  const intervalRef = useRef(null)

  const [appState, setAppState]         = useState(STATE.IDLE)
  const [result, setResult]             = useState(null)
  const [blinkCount, setBlinkCount]     = useState(0)
  const [ear, setEar]                   = useState(null)
  const [livenessFrames, setLivenessFrames] = useState(0)

  // Clear on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  // ── Step 1: Start liveness — send frames every 400ms ─────────────────────
  const startLiveness = useCallback(() => {
    setAppState(STATE.LIVENESS)
    setBlinkCount(0)
    setEar(null)
    setLivenessFrames(0)
    
    let detectedBlinks = 0
    let earBelowFrames = 0

    intervalRef.current = setInterval(async () => {
      const frame = webcamRef.current?.getScreenshot()
      if (!frame) return

      setLivenessFrames(f => f + 1)
      try {
        const res  = await faceAPI.livenessCheck(frame)
        const data = res.data.data
        const currentEar = data.ear
        setEar(currentEar)
        
        if (currentEar !== null) {
          if (currentEar < 0.25) {
            earBelowFrames += 1
          } else {
            if (earBelowFrames >= 1) { // Exaggerated blink or OpenCV closed eyes mode
              detectedBlinks += 1
              setBlinkCount(detectedBlinks)
            }
            earBelowFrames = 0
          }
        }

        if (detectedBlinks >= 1) {
          clearInterval(intervalRef.current)
          await runRecognition()
        }
      } catch {
        // network hiccup, skip frame
      }
    }, 250)

    // 10s timeout
    setTimeout(() => {
      if (appState === STATE.LIVENESS) {
        clearInterval(intervalRef.current)
        setAppState(STATE.FAIL_LIVE)
      }
    }, 10000)
  }, [])

  // ── Step 2: Run face recognition ─────────────────────────────────────────
  async function runRecognition() {
    setAppState(STATE.PROCESSING)
    const frame = webcamRef.current?.getScreenshot()
    if (!frame) {
      setAppState(STATE.FAIL_FACE)
      return
    }
    try {
      const res  = await faceAPI.recognize(frame, false) // liveness already done
      const data = res.data

      if (!data.success || !data.data?.matched) {
        setAppState(STATE.FAIL_FACE)
        return
      }

      const { user_id, user: matchedUser, confidence_score } = data.data

      // ── Step 3: Mark attendance ─────────────────────────────────────────
      try {
        await attendanceAPI.mark(user_id, confidence_score)
        setResult({ user: matchedUser, confidence: confidence_score })
        setAppState(STATE.SUCCESS)
        toast.success(`Welcome, ${matchedUser?.name}! Attendance marked ✓`)
      } catch (attErr) {
        const detail = attErr.response?.data?.detail || ''
        if (detail.includes('already')) {
          setResult({ user: matchedUser, confidence: confidence_score })
          setAppState(STATE.ALREADY)
        } else {
          throw attErr
        }
      }
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (detail.includes('already')) {
        setAppState(STATE.ALREADY)
      } else {
        toast.error('Recognition failed. Please try again.')
        setAppState(STATE.FAIL_FACE)
      }
    }
  }

  function reset() {
    clearInterval(intervalRef.current)
    setAppState(STATE.IDLE)
    setResult(null)
    setBlinkCount(0)
    setEar(null)
  }

  const livenessStatus =
    appState === STATE.LIVENESS    ? 'checking'
    : appState === STATE.FAIL_LIVE ? 'failed'
    : appState === STATE.SUCCESS || appState === STATE.ALREADY ? 'passed'
    : 'idle'

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <ScanFace size={24} className="text-brand-400" />
          Mark Attendance
        </h1>
        <p className="page-subtitle">Face recognition with live liveness detection</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Webcam panel */}
        <div className="card p-6 flex flex-col items-center gap-5">
          <WebcamCapture
            ref={webcamRef}
            showCaptureButton={false}
            className="w-full"
          />

          {/* Action buttons */}
          {appState === STATE.IDLE && (
            <button onClick={startLiveness} className="btn-primary w-full py-3 gap-2">
              <ShieldCheck size={18} />
              Start Liveness Check
            </button>
          )}
          {(appState === STATE.SUCCESS || appState === STATE.FAIL_FACE ||
            appState === STATE.FAIL_LIVE || appState === STATE.ALREADY) && (
            <button onClick={reset} className="btn-secondary w-full py-3 gap-2">
              <RotateCcw size={16} />
              Try Again
            </button>
          )}
          {appState === STATE.PROCESSING && (
            <div className="flex items-center gap-2 text-brand-400 text-sm font-medium">
              <Loader2 size={16} className="animate-spin" />
              Recognizing face…
            </div>
          )}
        </div>

        {/* Status panel */}
        <div className="flex flex-col gap-4">
          {/* Liveness guide */}
          <LivenessGuide
            status={livenessStatus}
            blinkCount={blinkCount}
            ear={ear}
          />

          {/* Frame counter during liveness */}
          {appState === STATE.LIVENESS && (
            <div className="card p-4 text-sm text-surface-400 flex items-center justify-between">
              <span>Frames analyzed</span>
              <span className="font-mono text-white">{livenessFrames}</span>
            </div>
          )}

          {/* Result card */}
          {appState === STATE.SUCCESS && result && (
            <div className="card p-6 border-success/30 bg-success/5 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 size={28} className="text-success" />
                <div>
                  <div className="font-bold text-white text-lg">{result.user?.name}</div>
                  <div className="text-success text-sm font-medium">Attendance Marked ✓</div>
                </div>
              </div>
              <div className="text-surface-400 text-xs mb-1">Match Confidence</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.round((result.confidence || 0) * 100)}%` }}
                  />
                </div>
                <span className="text-white font-mono text-sm font-semibold">
                  {((result.confidence || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {appState === STATE.ALREADY && (
            <div className="card p-5 border-warning/30 bg-warning/5 animate-slide-up">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-warning" />
                <div>
                  <div className="font-semibold text-white">Already Marked</div>
                  <div className="text-warning text-sm">Attendance already recorded for today.</div>
                </div>
              </div>
            </div>
          )}

          {appState === STATE.FAIL_FACE && (
            <div className="card p-5 border-danger/30 bg-danger/5 animate-slide-up">
              <div className="flex items-center gap-3">
                <XCircle size={24} className="text-danger" />
                <div>
                  <div className="font-semibold text-white">Face Not Recognized</div>
                  <div className="text-danger text-sm">Please ensure good lighting and face is registered.</div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {appState === STATE.IDLE && (
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-3 text-sm">How it works</h3>
              <ol className="space-y-2 text-sm text-surface-400">
                {[
                  'Position your face clearly in the camera frame',
                  'Click "Start Liveness Check" and blink naturally',
                  'The system will verify your identity using AI',
                  'Attendance is marked automatically on recognition',
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 text-xs
                                     flex items-center justify-center font-bold flex-shrink-0 mt-px">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
