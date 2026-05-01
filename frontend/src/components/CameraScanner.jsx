import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Loader2, ScanLine } from 'lucide-react';

/**
 * Live-camera scanner.
 *
 *  • Requests the rear camera on mobile (facingMode: 'environment') and falls back to default.
 *  • Renders a full <video> preview with a centered viewfinder overlay.
 *  • Capture → draws the current video frame onto an offscreen <canvas>,
 *    converts it to a JPEG Blob and calls onCapture(blob).
 *
 * Parent owns the submit logic (it typically calls /api/food/analyze with the blob).
 */
export default function CameraScanner({ onCapture, busy = false, buttonLabel = 'Scan & analyze' }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [ready, setReady]     = useState(false);
  const [error, setError]     = useState(null);
  const [snapshot, setSnapshot] = useState(null); // dataURL preview after capture
  const [blob, setBlob]       = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    setSnapshot(null);
    setBlob(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not available in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setReady(true);
    } catch (e) {
      setError(e?.message || 'Unable to access camera. Check permissions.');
    }
  }, []);

  // auto-start on mount, release on unmount
  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [startStream, stopStream]);

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    const w = video.videoWidth  || 1280;
    const h = video.videoHeight || 720;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob((b) => {
      if (!b) return;
      setBlob(b);
      setSnapshot(canvas.toDataURL('image/jpeg', 0.9));
      // stop preview once a frame has been captured – saves battery on mobile
      stopStream();
    }, 'image/jpeg', 0.9);
  };

  const retake = () => {
    setBlob(null);
    setSnapshot(null);
    startStream();
  };

  const submit = () => {
    if (blob && !busy) onCapture?.(blob);
  };

  return (
    <div className="space-y-4" data-testid="camera-scanner">
      <div className="relative rounded-3xl overflow-hidden border border-leaf-100 bg-black aspect-[3/4] sm:aspect-video">
        {/* Live preview */}
        {!snapshot && (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
            data-testid="camera-video"
          />
        )}

        {/* Captured frame preview */}
        {snapshot && (
          <img
            src={snapshot}
            alt="captured"
            className="w-full h-full object-contain bg-black"
            data-testid="camera-snapshot"
          />
        )}

        {/* Viewfinder overlay (only while live) */}
        {!snapshot && ready && !error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[70%] h-[55%] rounded-3xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            <div className="absolute bottom-3 left-0 right-0 text-center text-white/90 text-xs font-medium tracking-wide">
              Align the label inside the box
            </div>
          </div>
        )}

        {/* Error / loading states */}
        {!ready && !error && !snapshot && (
          <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Starting camera…
            </div>
          </div>
        )}
        {error && !snapshot && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="text-white/90 space-y-3 max-w-sm">
              <CameraOff size={28} className="mx-auto opacity-80" />
              <p className="text-sm" data-testid="camera-error">{error}</p>
              <button type="button" className="btn-ghost !bg-white/10 !text-white !border-white/30" onClick={startStream}>
                <RefreshCw size={14}/> Try again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas used for frame-capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {!snapshot && (
          <button
            type="button"
            className="btn-primary disabled:opacity-50"
            onClick={capture}
            disabled={!ready || busy}
            data-testid="camera-capture-btn"
          >
            <Camera size={16}/> Capture
          </button>
        )}
        {snapshot && !busy && (
          <>
            <button
              type="button"
              className="btn-primary"
              onClick={submit}
              data-testid="camera-submit-btn"
            >
              <ScanLine size={16}/> {buttonLabel}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={retake}
              data-testid="camera-retake-btn"
            >
              <RefreshCw size={16}/> Retake
            </button>
          </>
        )}
        {busy && (
          <span className="inline-flex items-center gap-2 text-leaf-700 text-sm">
            <Loader2 size={16} className="animate-spin"/> Analyzing…
          </span>
        )}
      </div>
    </div>
  );
}