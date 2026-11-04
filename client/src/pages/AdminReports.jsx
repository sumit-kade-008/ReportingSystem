// client/src/pages/AdminReports.jsx
// Admin Master Reports Explorer with full filters, master Leaflet map, and routing override controls.

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ReportMap from '../components/map/ReportMap';
import {
  CATEGORIES,
  DEPARTMENTS,
  SEVERITIES,
  STATUSES,
  SEVERITY_COLORS,
  STATUS_COLORS,
  DEPARTMENT_COLORS,
} from '../utils/constants';
import { X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('table'); // 'table' or 'map'

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reassign Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [targetDept, setTargetDept] = useState('Road');
  const [targetStatus, setTargetStatus] = useState('Assigned');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [departmentFilter, statusFilter, severityFilter, categoryFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (departmentFilter) params.department = departmentFilter;
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.get('/reports', { params });
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReassignModal = (report) => {
    setSelectedReport(report);
    setTargetDept(report.department === 'Unassigned' ? 'Road' : report.department);
    setTargetStatus(report.status);
    setAdminNotes(report.adminNotes || '');
    setModalOpen(true);
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setSubmitting(true);
    try {
      await api.patch(`/reports/${selectedReport._id}/admin-reassign`, {
        department: targetDept,
        status: targetStatus,
        adminNotes,
      });
      setModalOpen(false);
      fetchReports();
    } catch (err) {
      console.error('Override reassign failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.location?.address && r.location.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-surface min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded border border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-ink-muted block">
              Central Operations
            </span>
            <h1 className="text-2xl font-semibold text-ink">
              All city reports
            </h1>
            <p className="text-sm text-ink-muted">
              Inspect, filter, and override department assignments across all municipal zones.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReports}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[40px] disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh reports'}
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded border border-line flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, category, pin..."
              className="px-3 py-1.5 text-sm bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent min-h-[38px] w-full sm:w-56"
            />

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[38px]"
            >
              <option value="">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d} Department
                </option>
              ))}
              <option value="Unassigned">Unassigned (Pending)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[38px]"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[38px]"
            >
              <option value="">All severities</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle View */}
          <div className="flex items-center border border-line rounded p-0.5 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 text-xs font-medium rounded transition ${
                activeTab === 'table' ? 'bg-surface font-semibold text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Table view
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 text-xs font-medium rounded transition ${
                activeTab === 'map' ? 'bg-surface font-semibold text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              City map ({filteredReports.length})
            </button>
          </div>
        </div>

        {/* View Component: Table or Map */}
        {activeTab === 'map' ? (
          <div className="bg-white p-4 rounded border border-line space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Geographic map of all reports</h2>
              <span className="text-xs text-ink-muted">Click markers for details or assignment override</span>
            </div>
            <ReportMap reports={filteredReports} height="560px" onSelectReport={handleOpenReassignModal} />
          </div>
        ) : (
          <div className="bg-white rounded border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink">
                <thead className="bg-surface text-xs font-semibold text-ink-muted border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Report & Category</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ink-muted">
                        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-sm">Loading master reports...</span>
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ink-muted text-sm">
                        No reports matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report._id} className="hover:bg-surface/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {report.imageUrl ? (
                              <img
                                src={report.imageUrl}
                                alt="Report"
                                className="w-10 h-10 rounded object-cover border border-line shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-surface border border-line flex items-center justify-center text-[10px] text-ink-muted shrink-0">
                                None
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-ink leading-snug">{report.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-muted">
                                <span>{report.category}</span>
                                <span>•</span>
                                <span className="font-mono text-[10px]">#{report._id.slice(-6)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-sm font-medium border ${SEVERITY_COLORS[report.severity]}`}>
                            {report.severity}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-sm font-medium border ${DEPARTMENT_COLORS[report.department] || 'border-line'}`}>
                            {report.department}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-sm font-medium border ${STATUS_COLORS[report.status]}`}>
                            {report.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs text-ink-muted max-w-xs truncate">
                          {report.location?.address}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenReassignModal(report)}
                            className="px-2.5 py-1 rounded border border-line bg-white hover:bg-surface text-ink text-xs font-medium transition min-h-[30px]"
                          >
                            Reassign
                          </button>
                          <Link
                            to={`/reports/${report._id}`}
                            className="inline-flex items-center justify-center p-1.5 rounded border border-line text-ink-muted hover:text-ink hover:bg-surface transition align-middle"
                            title="Inspect report"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reassign / Override Modal */}
      {modalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="bg-white rounded max-w-lg w-full p-6 border border-line shadow-modal space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-xs font-medium text-ink-muted block">Administrative reassignment</span>
                <h3 className="text-base font-semibold text-ink leading-tight mt-0.5">{selectedReport.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Target department <span className="text-xs text-ink-muted font-normal">(required)</span>
                </label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[44px]"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} Department
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Status <span className="text-xs text-ink-muted font-normal">(required)</span>
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[44px]"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Override note <span className="text-xs text-ink-muted font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Reason for reassigning or updating status."
                  className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px]"
                >
                  {submitting ? 'Applying...' : 'Apply override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
