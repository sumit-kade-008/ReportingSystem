// client/src/pages/MyReports.jsx
// Citizen dashboard to view personal reports, track department status, and inspect resolution timelines.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { SEVERITY_COLORS, STATUS_COLORS, DEPARTMENT_COLORS } from '../utils/constants';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  MapPin,
  Building2,
  Star,
} from 'lucide-react';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const res = await api.get('/reports/my');
      setReports(res.data.reports);
    } catch (err) {
      console.error('Failed to fetch personal reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const activeCount = reports.filter((r) => r.status !== 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-2 border border-blue-200">
              <FileText className="w-3.5 h-3.5" />
              Citizen Activity Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Emergency Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track real-time progress, assigned departments, and proof-of-work updates.
            </p>
          </div>

          <Link
            to="/submit-report"
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg transition"
          >
            <PlusCircle className="w-4 h-4" />
            Report New Incident
          </Link>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Submitted</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{reports.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-xs text-amber-500 font-semibold uppercase">In Progress / Pending</span>
            <p className="text-2xl font-black text-amber-500 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-xs text-emerald-600 font-semibold uppercase">Resolved</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Loading your submitted reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No reports submitted yet</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                You haven't logged any infrastructure issues in the city yet.
              </p>
              <Link
                to="/submit-report"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-700 transition"
              >
                Submit Your First Emergency Report
              </Link>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report._id}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  {report.imageUrl ? (
                    <img
                      src={report.imageUrl}
                      alt={report.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${SEVERITY_COLORS[report.severity]}`}>
                        {report.severity}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[report.status]}`}>
                        {report.status}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${DEPARTMENT_COLORS[report.department] || 'bg-slate-100'}`}>
                        {report.department} Dept
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                      {report.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-1">{report.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-xs">{report.location?.address}</span>
                      </span>
                      <span>•</span>
                      <span>Logged: {new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>

                    {report.feedback?.rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold pt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>You rated this resolution: {report.feedback.rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <Link
                    to={`/reports/${report._id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow"
                  >
                    View Status Timeline
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReports;
