// client/src/pages/AdminDashboard.jsx
// Centralized Municipal Administrator Portal featuring city-wide KPIs,
// Chart.js department performance analytics, Pending triage queue, and Department user creation.

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { DEPARTMENTS, STATUS_COLORS, SEVERITY_COLORS } from '../utils/constants';
import {
  ShieldAlert,
  BarChart3,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  UserPlus,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  MapPin,
  X,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
  });

  const [performance, setPerformance] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reassign Modal State (Admin Triage / Override)
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [targetDept, setTargetDept] = useState('Road');
  const [adminNotes, setAdminNotes] = useState('');
  const [triageSubmitting, setTriageSubmitting] = useState(false);

  // Create Department User Modal State
  const [createDeptModalOpen, setCreateDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Road',
    phone: '',
  });
  const [createDeptSuccess, setCreateDeptSuccess] = useState('');
  const [createDeptError, setCreateDeptError] = useState('');
  const [createDeptSubmitting, setCreateDeptSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [overviewRes, perfRes, pendingRes] = await Promise.all([
        api.get('/stats/admin-overview'),
        api.get('/stats/department-performance'),
        api.get('/reports?status=Pending'),
      ]);

      setStats(overviewRes.data.stats);
      setPerformance(perfRes.data.performance || []);
      setPendingReports(pendingRes.data.reports || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setTriageSubmitting(true);
    try {
      await api.patch(`/reports/${selectedReport._id}/admin-reassign`, {
        department: targetDept,
        status: 'Assigned',
        adminNotes: adminNotes || `Assigned to ${targetDept} Department by Administrator triage.`,
      });
      setTriageModalOpen(false);
      fetchAdminData();
    } catch (err) {
      console.error('Triage assignment failed:', err);
    } finally {
      setTriageSubmitting(false);
    }
  };

  const handleCreateDeptSubmit = async (e) => {
    e.preventDefault();
    setCreateDeptSubmitting(true);
    setCreateDeptError('');
    setCreateDeptSuccess('');
    try {
      await api.post('/auth/create-department', deptForm);
      setCreateDeptSuccess(`Department account for ${deptForm.department} created successfully!`);
      setDeptForm({
        name: '',
        email: '',
        password: '',
        department: 'Road',
        phone: '',
      });
      setTimeout(() => {
        setCreateDeptModalOpen(false);
        setCreateDeptSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Create dept user failed:', err);
      setCreateDeptError(err.response?.data?.message || 'Failed to create department account.');
    } finally {
      setCreateDeptSubmitting(false);
    }
  };

  // Chart 1: Department Resolution Rate Bar Chart
  const perfLabels = performance.map((p) => p.department);
  const perfData = {
    labels: perfLabels,
    datasets: [
      {
        label: 'Resolution Rate (%)',
        data: performance.map((p) => p.resolutionRate),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Avg Resolution Time (Hours)',
        data: performance.map((p) => p.avgResolutionHours),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  // Chart 2: System Status Doughnut Chart
  const statusDoughnutData = {
    labels: ['Pending Triage', 'Assigned', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [stats.pending, stats.assigned, stats.inProgress, stats.resolved],
        backgroundColor: ['#a855f7', '#3b82f6', '#f59e0b', '#10b981'],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Admin Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Municipal Command & Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              City-Wide Administration Dashboard
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Cross-department analytics, emergency triage queue, and departmental efficiency audit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCreateDeptModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition shadow"
            >
              <UserPlus className="w-4 h-4" />
              Create Dept User
            </button>
            <button
              onClick={fetchAdminData}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition border border-slate-700 shadow"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* City-Wide KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Logged</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-sm text-center">
            <span className="text-[11px] font-bold text-purple-600 uppercase">Pending Triage</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm text-center">
            <span className="text-[11px] font-bold text-blue-600 uppercase">Assigned</span>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.assigned}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm text-center">
            <span className="text-[11px] font-bold text-amber-500 uppercase">In Progress</span>
            <p className="text-2xl font-black text-amber-500 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm text-center">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Resolved</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/30 shadow-sm text-center">
            <span className="text-[11px] font-bold text-red-600 uppercase">Critical Active</span>
            <p className="text-2xl font-black text-red-600 mt-1 animate-pulse">{stats.critical}</p>
          </div>
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Department Performance (Bar) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Department Performance & Resolution Speeds
                </h3>
                <p className="text-xs text-slate-400">Resolution % vs Average Time Spent (Hours)</p>
              </div>
            </div>
            <div className="h-72 w-full pt-2">
              <Bar
                data={perfData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                  },
                }}
              />
            </div>
          </div>

          {/* Chart 2: Resolution Status Ratio (Doughnut) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                Emergency Status Distribution
              </h3>
              <p className="text-xs text-slate-400">Total volume broken down by workflow phase</p>
            </div>
            <div className="h-56 w-full flex items-center justify-center py-2">
              <Doughnut
                data={statusDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Pending Triage Queue (Unassigned / Other / Traffic / Bridge) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                Admin Triage Queue
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Unassigned & Pending Emergencies ({pendingReports.length})
              </h3>
              <p className="text-xs text-slate-500">
                Categories without auto-routing (e.g. Traffic Signal, Bridge, Accident) require manual department assignment.
              </p>
            </div>
            <Link
              to="/admin/reports"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
            >
              View All Master Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingReports.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All incoming reports have been routed to departments. No triage backlog!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingReports.map((report) => (
                <div
                  key={report._id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {report.imageUrl && (
                      <img
                        src={report.imageUrl}
                        alt="Evidence"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${SEVERITY_COLORS[report.severity]}`}>
                          {report.severity}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600">{report.category}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{report.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{report.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.location?.address}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setTriageModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow"
                    >
                      Assign Dept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reassign / Triage Modal */}
      {triageModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-purple-600 uppercase">Admin Triage / Override</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedReport.title}</h3>
              </div>
              <button onClick={() => setTriageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriageSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign To Department *
                </label>
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Admin Dispatch Note
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Routed to Electricity department for signal wire repair."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTriageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triageSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow"
                >
                  {triageSubmitting ? 'Routing...' : 'Confirm Routing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Department Account Modal */}
      {createDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase">Admin Staff Management</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Create Department User Account</h3>
              </div>
              <button onClick={() => setCreateDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createDeptSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                {createDeptSuccess}
              </div>
            )}
            {createDeptError && (
              <div className="mt-3 p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-semibold">
                {createDeptError}
              </div>
            )}

            <form onSubmit={handleCreateDeptSubmit} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Officer Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Officer Raman (Water Works)"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={deptForm.email}
                  onChange={(e) => setDeptForm({ ...deptForm, email: e.target.value })}
                  placeholder="water-officer@eirs.com"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department *</label>
                <select
                  value={deptForm.department}
                  onChange={(e) => setDeptForm({ ...deptForm, department: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} Department
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={deptForm.password}
                  onChange={(e) => setDeptForm({ ...deptForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeptSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                >
                  {createDeptSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
