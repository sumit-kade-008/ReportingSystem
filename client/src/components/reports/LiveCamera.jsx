// client/src/components/reports/LiveCamera.jsx
// In-app live camera component enforcing live photo capture with HTML5 canvas watermarking
// (Timestamp + GPS Coordinates). No file picker fallback.

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

const LiveCamera = ({ latitude, longitude, accuracy, onPhotoCaptured, onPhotoCleared }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setStarting(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Live Camera is not supported by this browser. Please open over HTTPS or use modern Chrome/Safari on mobile.'
      );
      setStarting(false);
      return;
    }

    try {
      // Prefer rear environment camera on mobile phones
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission was denied. To report an emergency, tap the browser lock/settings icon and allow Camera access.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device was detected on your device.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unable to start camera stream'}.`);
      }
    } finally {
      setStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    // 1. Draw live camera video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Capture exact capture timestamp
    const capturedDate = new Date();
    const timestampStr = capturedDate.toLocaleString('en-IN', {
      timeZoneName: 'short',
    });

    // Coordinates string
    const latStr = latitude ? Number(latitude).toFixed(5) : 'UNKNOWN';
    const lngStr = longitude ? Number(longitude).toFixed(5) : 'UNKNOWN';
    const accStr = accuracy ? `±${Math.round(accuracy)}m` : 'N/A';
    const locationStr = `LAT: ${latStr} | LNG: ${lngStr} (ACC: ${accStr})`;

    // 2. Draw Anti-Fraud Watermark Banner at the bottom
    const bannerHeight = Math.max(50, Math.round(height * 0.08));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // semi-transparent dark slate
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Accent line
    ctx.fillStyle = '#ef4444'; // Red accent
    ctx.fillRect(0, height - bannerHeight, width, 4);

    // Watermark Text styling
    const fontSize = Math.max(14, Math.round(bannerHeight * 0.28));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#ffffff';

    // Left line: App stamp & timestamp
    const textY1 = height - bannerHeight + fontSize + 8;
    ctx.fillText(`● EIRS LIVE VERIFIED | ${timestampStr}`, 16, textY1);

    // Second line: GPS Coordinates & Accuracy
    ctx.font = `500 ${Math.max(12, Math.round(fontSize * 0.85))}px monospace`;
    ctx.fillStyle = '#fde047'; // Amber yellow for GPS
    const textY2 = textY1 + fontSize + 4;
    ctx.fillText(`GPS: ${locationStr}`, 16, textY2);

    // 3. Export to JPEG Blob
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setCapturedPreview(previewUrl);
        stopCamera();

        // Pass blob, timestamp and preview to parent
        onPhotoCaptured({
          blob,
          capturedAt: capturedDate.toISOString(),
          previewUrl,
        });
      },
      'image/jpeg',
      0.9
    );
  };

  const handleRetake = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedPreview(null);
    if (onPhotoCleared) onPhotoCleared();
    startCamera();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-red-600" />
          Live Camera Capture (Anti-Fraud Verified) *
        </label>
        {capturedPreview && (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Watermarked & Ready
          </span>
        )}
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Viewport or Captured Preview */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center">
        {capturedPreview ? (
          // Captured and watermarked photo preview
          <div className="relative w-full h-full">
            <img src={capturedPreview} alt="Live Captured" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              Watermark Verified
            </div>
          </div>
        ) : cameraActive ? (
          // Live Video Feed
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder overlay */}
            <div className="absolute inset-4 border-2 border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
              <span className="text-[10px] font-bold text-white/80 bg-slate-900/50 px-2 py-0.5 rounded self-start">
                Live Viewfinder
              </span>
              <span className="text-[10px] text-white/80 bg-slate-900/50 px-2 py-0.5 rounded self-end">
                Hold phone steady
              </span>
            </div>
          </div>
        ) : cameraError ? (
          // Permission / Device Error Card
          <div className="p-6 text-center space-y-3 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-900/50 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Camera Access Required</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Camera Permission
            </button>
          </div>
        ) : (
          // Starting State
          <div className="text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
            <p className="text-xs font-semibold">Initializing camera hardware...</p>
          </div>
        )}
      </div>

      {/* Camera Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        {capturedPreview ? (
          <button
            type="button"
            onClick={handleRetake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retake Photo
          </button>
        ) : cameraActive ? (
          <button
            type="button"
            onClick={handleCapture}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-black shadow-lg shadow-red-600/30 transition hover:scale-105 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            Capture Live Photo
          </button>
        ) : null}
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        * Anti-fraud policy: Photos must be captured live with real-time GPS stamp. Gallery uploads are disabled.
      </p>
    </div>
  );
};

export default LiveCamera;
