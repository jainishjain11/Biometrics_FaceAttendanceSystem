import { forwardRef, useRef, useCallback } from 'react'
import ReactWebcam from 'react-webcam'
import { Camera, RefreshCw } from 'lucide-react'

const VIDEO_CONSTRAINTS = {
  width:       640,
  height:      480,
  facingMode:  'user',
  frameRate:   { ideal: 30 },
}

const WebcamCapture = forwardRef(function WebcamCapture(
  { onCapture, showCaptureButton = true, mirrored = true, className = '' },
  ref
) {
  const localRef = useRef(null)
  // Support both forwarded and local ref
  const webcamRef = ref || localRef

  const capture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot()
    if (screenshot && onCapture) onCapture(screenshot)
    return screenshot
  }, [webcamRef, onCapture])

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="webcam-wrapper w-full max-w-lg">
        {/* Scanner overlay line */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute left-0 right-0 h-0.5 bg-brand-500/60 blur-sm animate-scanner" />
        </div>
        {/* Corner brackets */}
        <div className="absolute inset-3 z-20 pointer-events-none">
          {/* TL */ }
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
          {/* TR */}
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
          {/* BL */}
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
          {/* BR */}
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
        </div>

        <ReactWebcam
          ref={webcamRef}
          audio={false}
          mirrored={mirrored}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.92}
          videoConstraints={VIDEO_CONSTRAINTS}
          className="w-full h-full object-cover rounded-2xl"
          onUserMediaError={(err) => console.error('Webcam error:', err)}
        />
      </div>

      {showCaptureButton && (
        <button onClick={capture} className="btn-primary gap-2 px-6 py-3">
          <Camera size={18} />
          Capture Photo
        </button>
      )}
    </div>
  )
})

export default WebcamCapture
