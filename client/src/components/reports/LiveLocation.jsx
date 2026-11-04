// client/src/components/reports/LiveLocation.jsx
// Location detector with OpenStreetMap reverse geocoding and read-only Leaflet preview.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

const fixedPinIcon = L.divIcon({
  className: 'live-gps-pin',
  html: `
    <div style="
      background-color: #1d4ed8;
      width: 22px;
      height: 22px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

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
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState('');

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLoading(true);
    setGpsError('');

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

        if (accuracy > 100) {
          setLoading(false);
          const msg = `Location accuracy is ±${Math.round(accuracy)}m (must be within 100m). Please move outdoors or near a window and retry.`;
          setGpsError(msg);
          if (onLocationInvalid) onLocationInvalid(msg);
          return;
        }

        let resolvedAddress = `Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
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
          console.warn('Reverse geocoding failed, falling back to coordinates:', geoErr);
        }

        setAddress(resolvedAddress);
        setLoading(false);

        onLocationDetected({
          latitude,
          longitude,
          accuracy,
          address: resolvedAddress,
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMsg = 'Failed to acquire location.';
        if (err.code === 1) {
          errorMsg = 'Location permission was denied. Please allow location access in your browser settings.';
        } else if (err.code === 2) {
          errorMsg = 'Location is unavailable on this device. Ensure device GPS is enabled.';
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
        maximumAge: 0,
      }
    );
  };

  const isLocationValid = coords && coords.accuracy <= 100 && !gpsError;

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-ink">
          Your location <span className="text-xs text-ink-muted font-normal">(required)</span>
        </label>
        <button
          type="button"
          onClick={detectLocation}
          disabled={loading}
          className="text-xs font-medium px-2.5 py-1 rounded border border-line bg-white hover:bg-surface text-ink transition disabled:opacity-50 min-h-[32px]"
        >
          {loading ? 'Detecting...' : 'Refresh location'}
        </button>
      </div>

      {gpsError ? (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-xs text-red-800 space-y-2">
          <p className="font-medium leading-normal">{gpsError}</p>
          <button
            type="button"
            onClick={detectLocation}
            className="px-2.5 py-1 bg-red-700 text-white rounded text-xs font-medium hover:bg-red-800 transition"
          >
            Retry location
          </button>
        </div>
      ) : isLocationValid ? (
        <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span className="font-medium">
            Location verified (accurate to ~{Math.round(coords.accuracy)} meters)
          </span>
          <span className="font-mono text-[11px] text-emerald-700">
            {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
          </span>
        </div>
      ) : null}

      {/* Map Preview */}
      <div className="h-52 w-full rounded overflow-hidden border border-line relative bg-surface">
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
              pathOptions={{ fillColor: '#1d4ed8', fillOpacity: 0.1, color: '#1d4ed8', weight: 1.5 }}
            />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted text-xs">
            <span>{loading ? 'Acquiring location...' : 'Location not available'}</span>
          </div>
        )}
      </div>

      {/* Detected Address */}
      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1">
          Detected address
        </label>
        <input
          type="text"
          readOnly
          value={address || (loading ? 'Resolving street address...' : 'Address not found')}
          className="w-full px-3 py-2 text-sm bg-surface border border-line rounded text-ink font-normal cursor-not-allowed min-h-[44px]"
        />
      </div>
    </div>
  );
};

export default LiveLocation;
