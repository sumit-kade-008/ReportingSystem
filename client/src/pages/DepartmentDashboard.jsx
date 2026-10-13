// client/src/pages/DepartmentDashboard.jsx
// Dedicated Department Portal with KPI counters, filterable reports table, interactive Leaflet map,
// and status update modal with work notes & proof-of-work photo upload.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReportMap from '../components/map/ReportMap';
import { SEVERITY_COLORS, STATUS_COLORS } from '../utils/constants';
import {
  Building2,
  AlertCircle,
  Clock,
  CheckCircle,
  Flame,
  Filter,
  RefreshCw,
  Search,
  Map as MapIcon,
  List,
  Upload,
  ArrowRight,
  Eye,
  FileCheck,
  X,
  MessageSquare,
} from 'lucide-react';

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
      // 1. Fetch Department KPI stats
      const statsRes = await api.get('/stats/department');
      setStats(statsRes.data.stats);

      // 2. Fetch Department-isolated reports
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;

      const reportsRes = await api.get('/reports/department', { params });
      setReports(reportsRes.data.reports);
    } catch (err) {
      console.error('Failed to fetch department dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (report) => {
    setSelectedReport(report);
    // Determine next natural status transition
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

      setFeedbackMsg({ type: 'success', text: `Report #${selectedReport._id.slice(-6)} updated to '${newStatus}'!` });
      setTimeout(() => {
        setModalOpen(false);
        fetchDashboardData();
      }, 1200);
    } catch (err) {
      console.error('Update status failed:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update report status. Please try again.',
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Department Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 mb-2">
              <Building2 className="w-3.5 h-3.5" />
              {departmentName} Department Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Emergency Action Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Real-time dispatch, field resolution tracking, and citizen communication.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition border border-slate-700 shadow"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* KPI Cards: New (Assigned), In Progress, Resolved, Critical */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: New / Assigned */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New (Assigned)</p>
              <h3 className="text-3xl font-black text-blue-600 mt-1">{stats.new}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting field crew</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: In Progress */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
              <h3 className="text-3xl font-black text-amber-500 mt-1">{stats.inProgress}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Under active repair</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Resolved */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</p>
              <h3 className="text-3xl font-black text-emerald-600 mt-1">{stats.resolved}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Proof submitted</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Critical */}
          <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm flex items-center justify-between bg-red-50/20">
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Critical Alerts</p>
              <h3 className="text-3xl font-black text-red-600 mt-1">{stats.critical}</h3>
              <p className="text-[11px] text-red-400 mt-0.5">Immediate attention</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
              <Flame className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Controls: Search, Filters, Table/Map Toggle */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search emergency or address..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Assigned (New)</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* View Toggle: Table vs Map */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end md:self-auto">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Map View ({reports.length})
            </button>
          </div>
        </div>

        {/* Content View: Table or Map */}
        {activeTab === 'map' ? (
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Geographical Emergency Incident Map</h3>
              <span className="text-xs text-slate-500">Pins colored by severity & status</span>
            </div>
            <ReportMap reports={filteredReports} height="560px" onSelectReport={handleOpenActionModal} />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Incident & Category</th>
                    <th className="py-4 px-4">Severity</th>
                    <th className="py-4 px-4">Location</th>
                    <th className="py-4 px-4">Current Status</th>
                    <th className="py-4 px-4">Reported By</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading department reports...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No reports matching your criteria for {departmentName} Department.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report._id} className="hover:bg-slate-50/70 transition">
                        {/* Title & Category & Photo */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {report.imageUrl ? (
                              <img
                                src={report.imageUrl}
                                alt="Evidence"
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <AlertCircle className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer" onClick={() => handleOpenActionModal(report)}>
                                {report.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-500 font-medium">{report.category}</span>
                                <span className="text-[10px] text-slate-400">#{report._id.slice(-6)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="py-4 px-4">
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold border ${SEVERITY_COLORS[report.severity]}`}>
                            {report.severity}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-4 px-4 text-xs text-slate-600 max-w-xs truncate">
                          {report.location?.address || `${report.location?.latitude?.toFixed(4)}, ${report.location?.longitude?.toFixed(4)}`}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold border ${STATUS_COLORS[report.status]}`}>
                            {report.status}
                          </span>
                        </td>

                        {/* Citizen */}
                        <td className="py-4 px-4 text-xs text-slate-600">
                          <p className="font-semibold text-slate-800">{report.citizen?.name || 'Citizen'}</p>
                          <p className="text-slate-400 text-[11px]">{report.citizen?.phone || report.citizen?.email || ''}</p>
                        </td>

                        {/* Action Button */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenActionModal(report)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition"
                          >
                            Update Status
                            <ArrowRight className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                  {departmentName} Department Field Action
                </span>
                <h3 className="text-lg font-bold mt-0.5">{selectedReport.title}</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateStatus} className="p-6 overflow-y-auto space-y-5 flex-1">
              {feedbackMsg.text && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold border ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              {/* Incident Details Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Category</span>
                  <p className="font-bold text-slate-800">{selectedReport.category}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Severity</span>
                  <p className="font-bold text-slate-800">{selectedReport.severity}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Current Status</span>
                  <p className="font-bold text-slate-800">{selectedReport.status}</p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 font-medium">Description</span>
                  <p className="text-slate-700 leading-relaxed mt-0.5">{selectedReport.description}</p>
                </div>
              </div>

              {/* Evidence Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Citizen Evidence Photo</label>
                  <img
                    src={selectedReport.imageUrl}
                    alt="Evidence"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                {selectedReport.resolvedProofUrl && (
                  <div>
                    <label className="block text-xs font-semibold text-emerald-700 mb-1">Current Resolved Proof</label>
                    <img
                      src={selectedReport.resolvedProofUrl}
                      alt="Resolved Proof"
                      className="w-full h-36 object-cover rounded-xl border border-emerald-200"
                    />
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Update Resolution Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStatus('In Progress')}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition ${
                      newStatus === 'In Progress'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('Resolved')}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition ${
                      newStatus === 'Resolved'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Resolved (Completed)
                  </button>
                </div>
              </div>

              {/* Work Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  Department Work Notes
                </label>
                <textarea
                  rows={3}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="e.g. Field crew dispatched; pipe replaced; tree cleared from roadway."
                  className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                ></textarea>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  * Note will be added to the citizen's progress timeline and trigger a notification alert.
                </span>
              </div>

              {/* Proof of Work Photo (Only if resolving or updating) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Upload Resolved Proof Photo (Optional/Recommended)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save & Notify Citizen'}
                  <ArrowRight className="w-4 h-4" />
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
