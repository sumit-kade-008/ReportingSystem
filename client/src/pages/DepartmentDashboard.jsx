// client/src/pages/DepartmentDashboard.jsx
// Dedicated Department Portal with KPI counters, filterable reports table, Leaflet map, and status update modal.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReportMap from '../components/map/ReportMap';
import { SEVERITY_COLORS, STATUS_COLORS } from '../utils/constants';
import { X } from 'lucide-react';

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const departmentName = user?.department || 'Department';

  const [stats, setStats] = useState({
    new: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    total: 0,
  });

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('table'); // 'table' or 'map'

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected report for Action/Update Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('In Progress');
  const [workNotes, setWorkNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, severityFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/stats/department');
      setStats(statsRes.data.stats);

      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;

      const reportsRes = await api.get('/reports/department', { params });
      setReports(reportsRes.data.reports || []);
    } catch (err) {
      console.error('Failed to fetch department dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (report) => {
    setSelectedReport(report);
    if (report.status === 'Assigned') setNewStatus('In Progress');
    else if (report.status === 'In Progress') setNewStatus('Resolved');
    else setNewStatus('Resolved');

    setWorkNotes(report.workNotes || '');
    setProofFile(null);
    setFeedbackMsg({ type: '', text: '' });
    setModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    setSubmitting(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('workNotes', workNotes);
      if (proofFile) {
        formData.append('resolvedProof', proofFile);
      }

      await api.patch(`/reports/${selectedReport._id}/department-status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFeedbackMsg({ type: 'success', text: `Report status updated to ${newStatus}.` });
      setTimeout(() => {
        setModalOpen(false);
        fetchDashboardData();
      }, 1000);
    } catch (err) {
      console.error('Update status failed:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update report status.',
      });
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
        {/* Department Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded border border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-ink-muted block">
              {departmentName} Department
            </span>
            <h1 className="text-2xl font-semibold text-ink">
              Department operations dashboard
            </h1>
            <p className="text-sm text-ink-muted">
              Review assigned reports, update work status, and provide field completion proof.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[40px] disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh reports'}
          </button>
        </div>

        {/* KPI Numbers in Plain Bordered Boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">New (Assigned)</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.new}</span>
            <span className="text-xs text-ink-subtle mt-0.5 block">Awaiting field response</span>
          </div>

          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">In progress</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.inProgress}</span>
            <span className="text-xs text-ink-subtle mt-0.5 block">Under repair</span>
          </div>

          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">Resolved</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.resolved}</span>
            <span className="text-xs text-ink-subtle mt-0.5 block">Completed reports</span>
          </div>

          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">Critical severity</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.critical}</span>
            <span className="text-xs text-ink-subtle mt-0.5 block">High urgency</span>
          </div>
        </div>

        {/* Filter Bar & View Toggle */}
        <div className="bg-white p-4 rounded border border-line flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, category, address..."
              className="px-3 py-1.5 text-sm bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent min-h-[38px] w-full sm:w-64"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[38px]"
            >
              <option value="">All statuses</option>
              <option value="Assigned">Assigned (New)</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[38px]"
            >
              <option value="">All severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Toggle View */}
          <div className="flex items-center border border-line rounded p-0.5 self-end md:self-auto">
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
              Map view ({reports.length})
            </button>
          </div>
        </div>

        {/* Content View: Table or Map */}
        {activeTab === 'map' ? (
          <div className="bg-white p-4 rounded border border-line space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Geographic distribution of reports</h2>
              <span className="text-xs text-ink-muted">Click any marker to view or update status</span>
            </div>
            <ReportMap reports={filteredReports} height="540px" onSelectReport={handleOpenActionModal} />
          </div>
        ) : (
          <div className="bg-white rounded border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink">
                <thead className="bg-surface text-xs font-semibold text-ink-muted border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Report & Category</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reported By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ink-muted">
                        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-sm">Loading department reports...</span>
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
                        {/* Title & Photo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {report.imageUrl ? (
                              <img
                                src={report.imageUrl}
                                alt="Evidence"
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
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(report)}
                                className="font-semibold text-ink hover:text-accent transition text-left leading-tight"
                              >
                                {report.title}
                              </button>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-muted">
                                <span>{report.category}</span>
                                <span>•</span>
                                <span>#{report._id.slice(-6)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-4">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-sm font-medium border ${SEVERITY_COLORS[report.severity]}`}>
                            {report.severity}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 text-xs text-ink-muted max-w-xs truncate">
                          {report.location?.address || `${report.location?.latitude?.toFixed(4)}, ${report.location?.longitude?.toFixed(4)}`}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-sm font-medium border ${STATUS_COLORS[report.status]}`}>
                            {report.status}
                          </span>
                        </td>

                        {/* Citizen */}
                        <td className="py-3 px-4 text-xs">
                          <p className="font-medium text-ink">{report.citizen?.name || 'Citizen'}</p>
                          <p className="text-ink-subtle">{report.citizen?.phone || report.citizen?.email || ''}</p>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(report)}
                            className="px-3 py-1.5 rounded border border-line bg-white hover:bg-surface text-ink text-xs font-medium transition min-h-[32px]"
                          >
                            Update status
                          </button>
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

      {/* Action / Status Update Modal */}
      {modalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="bg-white rounded max-w-xl w-full border border-line shadow-modal overflow-hidden max-h-[90vh] flex flex-col text-left">
            {/* Header */}
            <div className="p-4 bg-surface border-b border-line flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-ink-muted block">Update report status</span>
                <h3 className="text-base font-semibold text-ink leading-tight mt-0.5">
                  {selectedReport.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-ink-muted hover:text-ink hover:bg-white border border-transparent hover:border-line"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleUpdateStatus} className="p-6 overflow-y-auto space-y-4 flex-1">
              {feedbackMsg.text && (
                <div
                  className={`p-3 rounded text-xs font-medium border ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              {/* Summary */}
              <div className="p-3 rounded border border-line bg-surface text-xs space-y-1">
                <div className="flex flex-wrap gap-4 text-ink-muted">
                  <span>Category: <strong className="text-ink font-semibold">{selectedReport.category}</strong></span>
                  <span>Severity: <strong className="text-ink font-semibold">{selectedReport.severity}</strong></span>
                  <span>Current: <strong className="text-ink font-semibold">{selectedReport.status}</strong></span>
                </div>
                <p className="text-ink pt-1 text-xs">{selectedReport.description}</p>
              </div>

              {/* Status Segmented Buttons */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  New status <span className="text-xs text-ink-muted font-normal">(required)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('In Progress')}
                    className={`py-2 px-3 rounded border text-sm text-left transition min-h-[44px] border-l-4 border-l-amber-500 ${
                      newStatus === 'In Progress'
                        ? 'border-accent bg-accent-light/50 font-semibold text-ink'
                        : 'border-line bg-white text-ink hover:bg-surface font-normal'
                    }`}
                  >
                    In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('Resolved')}
                    className={`py-2 px-3 rounded border text-sm text-left transition min-h-[44px] border-l-4 border-l-emerald-600 ${
                      newStatus === 'Resolved'
                        ? 'border-accent bg-accent-light/50 font-semibold text-ink'
                        : 'border-line bg-white text-ink hover:bg-surface font-normal'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              {/* Work Notes */}
              <div>
                <label htmlFor="workNotes" className="block text-sm font-medium text-ink mb-1">
                  Department work notes <span className="text-xs text-ink-muted font-normal">(optional)</span>
                </label>
                <textarea
                  id="workNotes"
                  rows={3}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="e.g. Dispatched crew; leak fixed; debris cleared."
                  className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                ></textarea>
                <span className="text-xs text-ink-muted mt-1 block">
                  Notes are shown to the citizen and saved to the audit timeline.
                </span>
              </div>

              {/* Proof File */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Resolution photo proof <span className="text-xs text-ink-muted font-normal">(recommended when resolving)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  className="block w-full text-sm text-ink-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-line file:text-xs file:font-medium file:bg-surface file:text-ink hover:file:bg-white cursor-pointer"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
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
                  className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDashboard;
