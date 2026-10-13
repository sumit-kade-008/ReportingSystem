// client/src/components/map/LocationPicker.jsx
// Interactive Leaflet map allowing citizens to pin an exact location or auto-detect GPS.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin } from 'lucide-react';

const pinIcon = L.divIcon({
  className: 'location-picker-pin',
  html: `
    <div style="
      background-color: #ef4444;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Helper component to capture map clicks
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to dynamically pan map when location changes externally
const MapViewUpdater = ({ center }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 15);
    }
  }, [center, map]);
  return null;
};

const LocationPicker = ({ latitude, longitude, onLocationChange }) => {
  const defaultPos = [12.9716, 77.5946]; // Default to central coordinates
  const currentPos = latitude && longitude ? [latitude, longitude] : defaultPos;
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState('');

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setDetecting(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        onLocationChange(lat, lng, `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setDetecting(false);
      },
      (err) => {
        console.error('Geo error:', err);
        setGeoError('Unable to retrieve your current location. Please tap the map manually.');
        setDetecting(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-red-500" />
          Emergency Incident Location
        </label>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={detecting}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition disabled:opacity-50"
        >
          <Crosshair className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
          {detecting ? 'Locating...' : 'Use My Current GPS'}
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">{geoError}</p>
      )}

      <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-300 relative shadow-inner">
        <MapContainer center={currentPos} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler
            onLocationSelect={(lat, lng) => {
              onLocationChange(lat, lng, `Pinned: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            }}
          />
          <MapViewUpdater center={currentPos} />
          {latitude && longitude && <Marker position={[latitude, longitude]} icon={pinIcon} />}
        </MapContainer>

        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg text-[11px] text-slate-600 border border-slate-200 z-[400] flex items-center justify-between">
          <span>Click anywhere on the map to place the incident pin</span>
          {latitude && longitude && (
            <span className="font-mono font-semibold text-slate-800">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
