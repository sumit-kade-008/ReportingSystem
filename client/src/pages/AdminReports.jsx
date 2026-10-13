// client/src/pages/AdminReports.jsx
// Admin Master Reports Explorer with full filters, master Leaflet map, and routing override controls.

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ReportMap from '../components/map/ReportMap';
import { CATEGORIES, DEPARTMENTS, SEVERITIES, STATUSES, SEVERITY_COLORS, STATUS_COLORS, DEPARTMENT_COLORS } from '../utils/constants';
import {
  Search,
  Filter,
  RefreshCw,
  MapPin,
  List,
  Map as MapIcon,
  ArrowRight,
  ShieldAlert,
  Building2,
  X,
  ExternalLink,
} from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-2 border border-indigo-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              Central Operations Command
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Master Emergency Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Inspect, reassign, and override department routings across all urban zones.
            </p>
          </div>

          <button
            onClick={fetchReports}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition shadow"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search emergency or pin..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value="Unassigned">Unassigned (Pending)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="">All Statuses</option>
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
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle View */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end lg:self-auto">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <List className="w-4 h-4" />
              Table View
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              City Map ({filteredReports.length})
            </button>
          </div>
        </div>

        {/* View Component */}
        {activeTab === 'map' ? (
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <ReportMap reports={filteredReports} height="600px" onSelectReport={handleOpenReassignModal} />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Incident & Category</th>
                    <th className="py-4 px-4">Severity</th>
                    <th className="py-4 px-4">Department</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Location</th>
                    <th className="py-4 px-6 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span>Loading master reports...</span>
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No reports matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {report.imageUrl ? (
                              <img
                                src={report.imageUrl}
                                alt="Report"
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                📷
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{report.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                <span>{report.category}</span>
                                <span>•</span>
                                <span className="font-mono text-[10px]">#{report._id.slice(-6)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold border ${SEVERITY_COLORS[report.severity]}`}>
                            {report.severity}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold border ${DEPARTMENT_COLORS[report.department] || 'bg-slate-100'}`}>
                            {report.department}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold border ${STATUS_COLORS[report.status]}`}>
                            {report.status}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-xs text-slate-600 max-w-xs truncate">
                          {report.location?.address}
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenReassignModal(report)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition"
                          >
                            Override / Reassign
                          </button>
                          <Link
                            to={`/reports/${report._id}`}
                            className="inline-block p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Inspect Timeline"
                          >
                            <ExternalLink className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase">Administrator Override</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedReport.title}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Department *</label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} Department
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Set Status *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Administrative Override Note
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Reason for reassignment or priority adjustment..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                >
                  {submitting ? 'Applying...' : 'Apply Override'}
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
