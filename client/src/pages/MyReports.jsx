// client/src/pages/MyReports.jsx
// Citizen portal to track submitted and linked reports with civic styling.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { SEVERITY_COLORS, STATUS_COLORS, DEPARTMENT_COLORS } from '../utils/constants';
import { MapPin } from 'lucide-react';

const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const res = await api.get('/reports/my');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Failed to fetch personal reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const activeCount = reports.filter((r) => r.status !== 'Resolved').length;

  return (
    <div className="bg-surface min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded border border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-ink">
              My reports
            </h1>
            <p className="text-sm text-ink-muted">
              Review current status, department notes, and resolution proof for your submitted reports.
            </p>
          </div>

          <Link
            to="/submit-report"
            className="self-start sm:self-auto inline-flex items-center justify-center px-4 py-2.5 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px]"
          >
            Submit report
          </Link>
        </div>

        {/* KPI Numbers in Plain Bordered Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded border border-line text-left">
            <span className="text-xs font-medium text-ink-muted block">Total reports</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{reports.length}</span>
          </div>

          <div className="bg-white p-4 rounded border border-line text-left">
            <span className="text-xs font-medium text-ink-muted block">In progress or pending</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{activeCount}</span>
          </div>

          <div className="bg-white p-4 rounded border border-line text-left">
            <span className="text-xs font-medium text-ink-muted block">Resolved</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{resolvedCount}</span>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-16 text-center text-ink-muted bg-white rounded border border-line">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-sm">Loading your reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-14 px-6 text-center bg-white rounded border border-line space-y-3">
              <h2 className="text-base font-semibold text-ink">You have not reported anything yet</h2>
              <p className="text-sm text-ink-muted max-w-md mx-auto">
                When you report an infrastructure problem, you can track repair progress and department responses here.
              </p>
              <div className="pt-2">
                <Link
                  to="/submit-report"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px]"
                >
                  Submit a report
                </Link>
              </div>
            </div>
          ) : (
            reports.map((report) => {
              const currentUserId = user?.id || user?._id;
              const originalCitizenId = report.citizen?._id || report.citizen;
              const isLinkedReport = originalCitizenId?.toString() !== currentUserId?.toString();

              return (
                <div
                  key={report._id}
                  className="bg-white p-4 sm:p-5 rounded border border-line text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {report.imageUrl ? (
                      <img
                        src={report.imageUrl}
                        alt={report.title}
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded object-cover border border-line shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded bg-surface border border-line flex items-center justify-center text-xs text-ink-muted shrink-0">
                        No photo
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-sm font-medium border ${STATUS_COLORS[report.status]}`}>
                          {report.status}
                        </span>

                        <span className={`text-xs px-2 py-0.5 rounded-sm font-medium border ${SEVERITY_COLORS[report.severity]}`}>
                          {report.severity}
                        </span>

                        <span className={`text-xs px-2 py-0.5 rounded-sm font-medium border ${DEPARTMENT_COLORS[report.department] || 'border-line'}`}>
                          {report.department} Department
                        </span>

                        {isLinkedReport && (
                          <span className="text-xs px-2 py-0.5 rounded-sm font-medium border border-line bg-surface text-ink-muted">
                            Linked confirmation
                          </span>
                        )}
                      </div>

                      <h2 className="text-base font-semibold text-ink leading-snug">
                        {report.title}
                      </h2>

                      <p className="text-sm text-ink-muted line-clamp-1">{report.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted pt-1">
                        {report.location?.address && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-[18px] h-[18px] text-ink-subtle" />
                            <span className="truncate max-w-xs">{report.location.address}</span>
                          </span>
                        )}
                        <span>Reported {new Date(report.createdAt).toLocaleDateString()}</span>
                        {report.reportCount > 1 && (
                          <span>Confirmed by {report.reportCount} citizens</span>
                        )}
                        {report.feedback?.rating && (
                          <span>Rating: {report.feedback.rating}/5</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <Link
                      to={`/reports/${report._id}`}
                      className="inline-flex items-center justify-center px-3.5 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[40px]"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReports;
