// client/src/components/map/LocationPicker.jsx
// Interactive Leaflet map allowing citizens to pin an exact location or detect GPS.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pinIcon = L.divIcon({
  className: 'location-picker-pin',
  html: `
    <div style="
      background-color: #1d4ed8;
      width: 22px;
      height: 22px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

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
  const defaultPos = [12.9716, 77.5946];
  const currentPos = latitude && longitude ? [latitude, longitude] : defaultPos;
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState('');

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
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
        setGeoError('Unable to retrieve current location. Click the map to set location manually.');
        setDetecting(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-ink">
          Incident location
        </label>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={detecting}
          className="text-xs font-medium px-2.5 py-1 rounded border border-line bg-white hover:bg-surface text-ink transition disabled:opacity-50 min-h-[32px]"
        >
          {detecting ? 'Detecting...' : 'Use current location'}
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-red-800 bg-red-50 p-2 rounded border border-red-200">{geoError}</p>
      )}

      <div className="h-64 w-full rounded overflow-hidden border border-line relative bg-surface">
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

        <div className="absolute bottom-2 left-2 right-2 bg-white/95 p-2 rounded text-xs text-ink-muted border border-line z-[400] flex items-center justify-between">
          <span>Click on the map to place the incident pin</span>
          {latitude && longitude && (
            <span className="font-mono text-ink font-medium">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
