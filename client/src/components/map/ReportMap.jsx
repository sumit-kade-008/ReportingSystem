// client/src/components/map/ReportMap.jsx
// Interactive OpenStreetMap Leaflet component rendering colored report markers and details popups.

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SEVERITY_COLORS, STATUS_COLORS } from '../../utils/constants';
import { ExternalLink, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// Custom SVG marker factory by severity
const createCustomMarker = (severity, status) => {
  let color = '#3b82f6'; // blue default
  if (severity === 'Critical') color = '#ef4444'; // red
  else if (severity === 'High') color = '#f97316'; // orange
  else if (severity === 'Medium') color = '#eab308'; // yellow
  else if (severity === 'Low') color = '#22c55e'; // green

  if (status === 'Resolved') color = '#10b981'; // emerald

  const html = `
    <div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
    ">
      ●
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const ReportMap = ({ reports = [], height = '500px', center = [12.9716, 77.5946], zoom = 12, onSelectReport }) => {
  // If reports exist, default center to first report coordinate
  const defaultCenter =
    reports.length > 0 && reports[0].location?.latitude
      ? [reports[0].location.latitude, reports[0].location.longitude]
      : center;

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-200">
      <MapContainer center={defaultCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                <div className="w-56 p-1 text-slate-800">
                  {report.imageUrl && (
                    <img
                      src={report.imageUrl}
                      alt={report.title}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1">{report.title}</h4>
                  <div className="flex flex-wrap items-center gap-1 my-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${SEVERITY_COLORS[report.severity]}`}>
                      {report.severity}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STATUS_COLORS[report.status]}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{report.location.address || 'GPS Coordinates'}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Dept: <span className="text-blue-600">{report.department}</span>
                  </p>
                  {onSelectReport ? (
                    <button
                      onClick={() => onSelectReport(report)}
                      className="mt-2 w-full py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Manage Emergency
                    </button>
                  ) : (
                    <Link
                      to={`/reports/${report._id}`}
                      className="mt-2 block text-center py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition"
                    >
                      View Report Details
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
