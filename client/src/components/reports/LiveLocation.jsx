// client/src/components/reports/LiveLocation.jsx
// High-accuracy live GPS detector with OpenStreetMap Nominatim reverse geocoding
// and read-only Leaflet preview. Manual pin placement is strictly disabled.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

const fixedPinIcon = L.divIcon({
  className: 'live-gps-pin',
  html: `
    <div style="
      background-color: #ef4444;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// Helper component to center map on new location
const MapCenterUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 16);
    }
  }, [center, map]);
  return null;
};

const LiveLocation = ({ onLocationDetected, onLocationInvalid }) => {
  const [coords, setCoords] = useState(null); // { latitude, longitude, accuracy }
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState('');
  const [accuracyWarning, setAccuracyWarning] = useState(false);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLoading(true);
    setGpsError('');
    setAccuracyWarning(false);

    if (!navigator.geolocation) {
      const err = 'Geolocation is not supported by your browser.';
      setGpsError(err);
      setLoading(false);
      if (onLocationInvalid) onLocationInvalid(err);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ latitude, longitude, accuracy });

        // Check Anti-fraud accuracy rule: must be <= 100 meters
        if (accuracy > 100) {
          setAccuracyWarning(true);
          setLoading(false);
          const msg = `GPS accuracy is ±${Math.round(accuracy)}m (worse than 100m). Please move to an open area with clear sky view and retry.`;
          setGpsError(msg);
          if (onLocationInvalid) onLocationInvalid(msg);
          return;
        }

        // Reverse geocoding via OpenStreetMap Nominatim
        let resolvedAddress = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              resolvedAddress = data.display_name;
            }
          }
        } catch (geoErr) {
          console.warn('Reverse geocoding fetch failed, falling back to coordinates:', geoErr);
        }

        setAddress(resolvedAddress);
        setLoading(false);

        // Notify parent of valid high-accuracy location
        onLocationDetected({
          latitude,
          longitude,
          accuracy,
          address: resolvedAddress,
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMsg = 'Failed to acquire GPS location.';
        if (err.code === 1) {
          errorMsg = 'Location permission was denied. Please allow location access in your browser settings to verify your emergency.';
        } else if (err.code === 2) {
          errorMsg = 'Location unavailable. Ensure your device GPS is turned on.';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out. Please retry.';
        }
        setGpsError(errorMsg);
        setLoading(false);
        if (onLocationInvalid) onLocationInvalid(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Force fresh live reading
      }
    );
  };

  const isLocationValid = coords && coords.accuracy <= 100 && !gpsError;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-blue-600" />
          Live GPS Location Verification *
        </label>
        <button
          type="button"
          onClick={detectLocation}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Detecting...' : 'Refresh GPS'}
        </button>
      </div>

      {/* GPS Status / Error / Accuracy Card */}
      {gpsError ? (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{gpsError}</p>
          </div>
          <button
            type="button"
            onClick={detectLocation}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
          >
            Move to Open Area & Retry GPS
          </button>
        </div>
      ) : isLocationValid ? (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">High-Accuracy GPS Verified:</span> ±{Math.round(coords.accuracy)} meters
            </div>
          </div>
          <span className="font-mono text-[11px] font-semibold text-emerald-700">
            {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
          </span>
        </div>
      ) : null}

      {/* Read-Only Map Preview (No click-to-pin allowed) */}
      <div className="h-56 w-full rounded-2xl overflow-hidden border border-slate-300 relative shadow-inner bg-slate-100">
        {coords && coords.latitude && coords.longitude ? (
          <MapContainer
            center={[coords.latitude, coords.longitude]}
            zoom={16}
            scrollWheelZoom={false}
            dragging={false}
            touchZoom={false}
            doubleClickZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterUpdater center={[coords.latitude, coords.longitude]} />
            <Marker position={[coords.latitude, coords.longitude]} icon={fixedPinIcon} />
            <Circle
              center={[coords.latitude, coords.longitude]}
              radius={coords.accuracy || 10}
              pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.15, color: '#2563eb', weight: 1.5 }}
            />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Navigation className="w-8 h-8 animate-bounce text-blue-500" />
            <span className="text-xs font-semibold">Acquiring high-accuracy satellite fix...</span>
          </div>
        )}

        <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-white z-[400] font-semibold">
          🔒 Read-Only Live Sensor Fix
        </div>
      </div>

      {/* Auto-filled Reverse Geocoded Address (Read-only) */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          Detected Address (Auto-resolved via OpenStreetMap Nominatim)
        </label>
        <input
          type="text"
          readOnly
          value={address || 'Detecting address...'}
          className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-not-allowed select-all"
        />
      </div>
    </div>
  );
};

export default LiveLocation;
