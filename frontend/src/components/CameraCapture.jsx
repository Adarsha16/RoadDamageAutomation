import { useState, useRef, useEffect, useCallback } from 'react';

export default function CameraCapture({ onFileSelected, disabled = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraKey, setCameraKey] = useState(0);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initCamera = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setError('Camera is not supported in this browser. Please use the Upload tab instead.');
          setActive(false);
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setError(null);
        setActive(true);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow access in your browser settings, or use the Upload tab.'
            : err.name === 'NotFoundError'
              ? 'No camera found on this device. Please use the Upload tab instead.'
              : 'Could not access camera. Please use the Upload tab instead.';
        setError(msg);
        setActive(false);
      }
    };

    initCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, cameraKey]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !active) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const preview = URL.createObjectURL(blob);
        setCapturedPreview(preview);
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        onFileSelected(file);
      },
      'image/jpeg',
      0.92,
    );
  }, [active, onFileSelected]);

  const handleRetake = useCallback(() => {
    if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    setCapturedPreview(null);
  }, [capturedPreview]);

  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
      setCapturedPreview(null);
    }
  }, [capturedPreview]);

  const handleStop = useCallback(() => {
    stopStream();
  }, [stopStream]);

  const handleStart = useCallback(() => {
    setCameraKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-surface-2">
        {error ? (
          <div className="p-10 sm:p-14 text-center">
            <svg className="w-10 h-10 text-text-muted mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            <p className="text-sm text-red-400 mb-2">{error}</p>
            <p className="text-xs text-text-muted">Switch to the Upload Image tab to select a file from your device.</p>
          </div>
        ) : capturedPreview ? (
          <div className="flex flex-col items-center p-6">
            <img
              src={capturedPreview}
              alt="Captured frame"
              className="max-h-64 rounded-md object-contain mb-4"
            />
            <p className="text-sm text-text-muted">Captured frame — analysis in progress or complete below</p>
          </div>
        ) : (
          <div className="relative aspect-video max-h-80 bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {!active && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-2/80">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {!error && (
        <div className="flex flex-wrap items-center gap-3">
          {!capturedPreview && active && (
            <>
              <button
                type="button"
                onClick={handleCapture}
                disabled={disabled}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
                Capture
              </button>
              <button
                type="button"
                onClick={handleSwitchCamera}
                disabled={disabled}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm text-text-secondary hover:border-border-light hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Switch Camera
              </button>
              <button
                type="button"
                onClick={handleStop}
                disabled={disabled}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm text-text-muted hover:border-border-light transition-colors disabled:opacity-50"
              >
                Stop Camera
              </button>
            </>
          )}
          {capturedPreview && !disabled && (
            <button
              type="button"
              onClick={handleRetake}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm text-text-secondary hover:border-border-light hover:text-text-primary transition-colors"
            >
              Retake
            </button>
          )}
          {!active && !error && (
            <button
              type="button"
              onClick={handleStart}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm text-text-secondary hover:border-border-light hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Start Camera
            </button>
          )}
        </div>
      )}
    </div>
  );
}
