// client/src/components/map/ReportMap.jsx
// OpenStreetMap Leaflet component rendering report markers and details popups.

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SEVERITY_COLORS, STATUS_COLORS } from '../../utils/constants';
import { Link } from 'react-router-dom';

const createCustomMarker = (severity, status) => {
  let color = '#1d4ed8'; // blue default
  if (severity === 'Critical') color = '#dc2626'; // red
  else if (severity === 'High') color = '#ea580c'; // orange
  else if (severity === 'Medium') color = '#d97706'; // amber
  else if (severity === 'Low') color = '#16a34a'; // green

  if (status === 'Resolved') color = '#059669'; // emerald

  const html = `
    <div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

const ReportMap = ({ reports = [], height = '500px', center = [12.9716, 77.5946], zoom = 12, onSelectReport }) => {
  const defaultCenter =
    reports.length > 0 && reports[0].location?.latitude
      ? [reports[0].location.latitude, reports[0].location.longitude]
      : center;

  return (
    <div style={{ height }} className="w-full rounded overflow-hidden border border-line">
      <MapContainer center={defaultCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {reports.map((report) => {
          if (!report.location?.latitude || !report.location?.longitude) return null;

          return (
            <Marker
              key={report._id}
              position={[report.location.latitude, report.location.longitude]}
              icon={createCustomMarker(report.severity, report.status)}
            >
              <Popup className="eirs-custom-popup">
                <div className="w-60 p-1 text-left text-ink">
                  {report.imageUrl && (
                    <img
                      src={report.imageUrl}
                      alt={report.title}
                      className="w-full h-24 object-cover rounded mb-2 border border-line"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <h4 className="font-semibold text-sm text-ink leading-tight mb-1">{report.title}</h4>
                  <div className="flex flex-wrap items-center gap-1 my-1.5">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-sm border font-medium ${SEVERITY_COLORS[report.severity]}`}>
                      {report.severity}
                    </span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-sm border font-medium ${STATUS_COLORS[report.status]}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 truncate">
                    {report.location.address || 'Coordinates only'}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Dept: <span className="font-medium text-ink">{report.department}</span>
                  </p>
                  {onSelectReport ? (
                    <button
                      type="button"
                      onClick={() => onSelectReport(report)}
                      className="mt-2 w-full py-1 text-xs font-medium bg-accent text-white rounded hover:bg-accent-hover transition min-h-[32px]"
                    >
                      Manage report
                    </button>
                  ) : (
                    <Link
                      to={`/reports/${report._id}`}
                      className="mt-2 block text-center py-1 text-xs font-medium bg-white text-ink border border-line rounded hover:bg-surface transition min-h-[32px] leading-6"
                    >
                      View details
                    </Link>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ReportMap;
