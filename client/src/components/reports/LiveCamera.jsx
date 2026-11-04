// client/src/components/reports/LiveCamera.jsx
// In-browser camera component with canvas timestamp and coordinate stamp.

import React, { useRef, useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

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

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Video play was prevented:', err);
      });
    }
  }, [stream, cameraActive]);

  const startCamera = async () => {
    setCameraError('');
    setStarting(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera is not supported by this browser. Please use Chrome, Safari, or Edge over HTTPS.'
      );
      setStarting(false);
      return;
    }

    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('Environment camera failed, falling back to default:', firstErr);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission was denied. Please allow camera access in your browser settings.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera was detected on this device.');
      } else {
        setCameraError(`Unable to start camera: ${err.message || 'unknown error'}`);
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
    if (!video.videoWidth || video.readyState < 2) {
      alert('Camera is still loading. Please wait a moment and try again.');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(video, 0, 0, width, height);

    const capturedDate = new Date();
    const timestampStr = capturedDate.toLocaleString('en-IN', {
      timeZoneName: 'short',
    });

    const latStr = latitude ? Number(latitude).toFixed(5) : 'UNKNOWN';
    const lngStr = longitude ? Number(longitude).toFixed(5) : 'UNKNOWN';
    const accStr = accuracy ? `±${Math.round(accuracy)}m` : 'N/A';
    const locationStr = `Lat: ${latStr} | Lng: ${lngStr} (${accStr})`;

    const bannerHeight = Math.max(44, Math.round(height * 0.07));
    ctx.fillStyle = 'rgba(31, 41, 51, 0.9)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    const fontSize = Math.max(13, Math.round(bannerHeight * 0.28));
    ctx.font = `500 ${fontSize}px sans-serif`;
    ctx.fillStyle = '#ffffff';

    const textY1 = height - bannerHeight + fontSize + 6;
    ctx.fillText(`EIRS Report Evidence • ${timestampStr}`, 14, textY1);

    ctx.font = `400 ${Math.max(11, Math.round(fontSize * 0.82))}px monospace`;
    ctx.fillStyle = '#e4e7eb';
    const textY2 = textY1 + fontSize + 4;
    ctx.fillText(locationStr, 14, textY2);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setCapturedPreview(previewUrl);
        stopCamera();

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
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-ink">
          Take a photo of the problem <span className="text-xs text-ink-muted font-normal">(required)</span>
        </label>
        {capturedPreview && (
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
            Photo captured
          </span>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Viewport or Preview */}
      <div className="relative w-full aspect-[4/3] max-h-72 bg-slate-900 rounded overflow-hidden border border-line flex items-center justify-center">
        {capturedPreview ? (
          <img src={capturedPreview} alt="Captured problem" className="w-full h-full object-cover" />
        ) : cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
            className="w-full h-full object-cover"
          />
        ) : cameraError ? (
          <div className="p-4 text-center space-y-2 max-w-sm text-white">
            <p className="text-sm font-medium">{cameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              className="px-3 py-1.5 rounded border border-line bg-white text-ink text-xs font-medium hover:bg-surface transition"
            >
              Retry camera
            </button>
          </div>
        ) : (
          <div className="text-center text-slate-400 text-xs">
            <span>Starting camera...</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div>
        {capturedPreview ? (
          <button
            type="button"
            onClick={handleRetake}
            className="px-4 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[44px]"
          >
            Retake photo
          </button>
        ) : cameraActive ? (
          <button
            type="button"
            onClick={handleCapture}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px]"
          >
            <Camera className="w-[18px] h-[18px]" />
            Take photo
          </button>
        ) : null}
      </div>

      <p className="text-xs text-ink-muted">
        Photos must be taken directly with your camera to confirm the location and time. File uploads are disabled.
      </p>
    </div>
  );
};

export default LiveCamera;
