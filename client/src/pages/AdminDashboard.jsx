// client/src/pages/AdminDashboard.jsx
// Centralized Municipal Administrator Portal featuring city-wide KPIs,
// Chart.js department analytics, triage queue, and department user management.

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
import { DEPARTMENTS, SEVERITY_COLORS } from '../utils/constants';
import { X } from 'lucide-react';

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
      setCreateDeptSuccess(`Department account for ${deptForm.department} created successfully.`);
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
      }, 1200);
    } catch (err) {
      console.error('Create dept user failed:', err);
      setCreateDeptError(err.response?.data?.message || 'Failed to create department account.');
    } finally {
      setCreateDeptSubmitting(false);
    }
  };

  // Chart 1: Department Resolution Rate Bar Chart (Muted Civic Colors)
  const perfLabels = performance.map((p) => p.department);
  const perfData = {
    labels: perfLabels,
    datasets: [
      {
        label: 'Resolution Rate (%)',
        data: performance.map((p) => p.resolutionRate),
        backgroundColor: '#1d4ed8', // Deep blue
        borderRadius: 4,
      },
      {
        label: 'Avg Resolution Time (Hours)',
        data: performance.map((p) => p.avgResolutionHours),
        backgroundColor: '#64748b', // Muted slate
        borderRadius: 4,
      },
    ],
  };

  // Chart 2: System Status Doughnut Chart (Muted Palette)
  const statusDoughnutData = {
    labels: ['Pending Triage', 'Assigned', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [stats.pending, stats.assigned, stats.inProgress, stats.resolved],
        backgroundColor: ['#94a3b8', '#1d4ed8', '#d97706', '#059669'],
        borderWidth: 1,
        borderColor: '#ffffff',
      },
    ],
  };

  return (
    <div className="bg-surface min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded border border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-ink-muted block">
              Municipal Administration
            </span>
            <h1 className="text-2xl font-semibold text-ink">
              City administration dashboard
            </h1>
            <p className="text-sm text-ink-muted">
              City-wide reporting oversight, department efficiency metrics, and triage dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateDeptModalOpen(true)}
              className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[40px]"
            >
              Create department user
            </button>
            <button
              type="button"
              onClick={fetchAdminData}
              disabled={loading}
              className="px-4 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[40px] disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* City-Wide KPI Numbers in Plain Bordered Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">Total reports</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.total}</span>
          </div>

          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">Pending triage</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.pending}</span>
          </div>

          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">Assigned</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.assigned}</span>
          </div>

          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">In progress</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.inProgress}</span>
          </div>

          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">Resolved</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.resolved}</span>
          </div>

          <div className="bg-white p-4 rounded border border-line">
            <span className="text-xs font-medium text-ink-muted block">Critical active</span>
            <span className="text-2xl font-semibold text-ink mt-1 block">{stats.critical}</span>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart 1: Department Performance */}
          <div className="lg:col-span-2 bg-white p-5 rounded border border-line space-y-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Department performance and resolution speed
              </h2>
              <p className="text-xs text-ink-muted">Resolution rate (%) and average resolution hours</p>
            </div>
            <div className="h-72 w-full pt-1">
              <Bar
                data={perfData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'IBM Plex Sans' } } },
                  },
                }}
              />
            </div>
          </div>

          {/* Chart 2: Status Breakdown */}
          <div className="bg-white p-5 rounded border border-line space-y-3 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Report status distribution
              </h2>
              <p className="text-xs text-ink-muted">Volume breakdown across resolution phases</p>
            </div>
            <div className="h-56 w-full flex items-center justify-center py-2">
              <Doughnut
                data={statusDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'IBM Plex Sans' } } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Pending Triage Queue */}
        <div className="bg-white p-6 rounded border border-line space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line pb-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Pending triage queue ({pendingReports.length})
              </h2>
              <p className="text-xs text-ink-muted">
                Unassigned categories requiring manual dispatch to a municipal department.
              </p>
            </div>
            <Link
              to="/admin/reports"
              className="text-xs font-medium text-accent hover:underline self-start sm:self-auto"
            >
              View all city reports
            </Link>
          </div>

          {pendingReports.length === 0 ? (
            <div className="py-8 text-center text-ink-muted text-sm">
              All incoming reports have been routed to departments.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingReports.map((report) => (
                <div
                  key={report._id}
                  className="p-4 rounded border border-line bg-surface flex flex-col justify-between gap-3 text-left"
                >
                  <div className="flex items-start gap-3">
                    {report.imageUrl && (
                      <img
                        src={report.imageUrl}
                        alt="Evidence"
                        className="w-14 h-14 rounded object-cover border border-line shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-sm font-medium border ${SEVERITY_COLORS[report.severity]}`}>
                          {report.severity}
                        </span>
                        <span className="text-xs text-ink-muted font-medium">{report.category}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-ink leading-tight">{report.title}</h3>
                      <p className="text-xs text-ink-muted line-clamp-1">{report.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
                    <span className="text-ink-muted truncate max-w-[200px]">
                      {report.location?.address}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReport(report);
                        setTriageModalOpen(true);
                      }}
                      className="px-3 py-1 rounded border border-line bg-white hover:bg-surface text-ink text-xs font-medium transition min-h-[32px]"
                    >
                      Assign department
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Triage Modal */}
      {triageModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="bg-white rounded max-w-lg w-full p-6 border border-line shadow-modal space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-xs font-medium text-ink-muted block">Administrative triage</span>
                <h3 className="text-base font-semibold text-ink leading-tight mt-0.5">{selectedReport.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setTriageModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriageSubmit} className="space-y-4">
              <div>
                <label htmlFor="targetDept" className="block text-sm font-medium text-ink mb-1">
                  Assign to department <span className="text-xs text-ink-muted font-normal">(required)</span>
                </label>
                <select
                  id="targetDept"
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
                <label htmlFor="adminNotes" className="block text-sm font-medium text-ink mb-1">
                  Dispatch notes <span className="text-xs text-ink-muted font-normal">(optional)</span>
                </label>
                <textarea
                  id="adminNotes"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Reason for assignment or special instructions."
                  className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setTriageModalOpen(false)}
                  className="px-4 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triageSubmitting}
                  className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px]"
                >
                  {triageSubmitting ? 'Assigning...' : 'Confirm assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Department User Modal */}
      {createDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="bg-white rounded max-w-md w-full p-6 border border-line shadow-modal space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-xs font-medium text-ink-muted block">Staff management</span>
                <h3 className="text-base font-semibold text-ink leading-tight mt-0.5">
                  Create department account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateDeptModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createDeptSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-medium">
                {createDeptSuccess}
              </div>
            )}
            {createDeptError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded text-xs font-medium">
                {createDeptError}
              </div>
            )}

            <form onSubmit={handleCreateDeptSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Staff name <span className="text-xs text-ink-muted font-normal">(required)</span>
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Officer Raman"
                  className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Email address <span className="text-xs text-ink-muted font-normal">(required)</span>
                </label>
                <input
                  type="email"
                  required
                  value={deptForm.email}
                  onChange={(e) => setDeptForm({ ...deptForm, email: e.target.value })}
                  placeholder="water-staff@eirs.com"
                  className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Department <span className="text-xs text-ink-muted font-normal">(required)</span>
                </label>
                <select
                  value={deptForm.department}
                  onChange={(e) => setDeptForm({ ...deptForm, department: e.target.value })}
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
                  Password <span className="text-xs text-ink-muted font-normal">(required, min 6 characters)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={deptForm.password}
                  onChange={(e) => setDeptForm({ ...deptForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[44px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setCreateDeptModalOpen(false)}
                  className="px-4 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeptSubmitting}
                  className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px]"
                >
                  {createDeptSubmitting ? 'Creating...' : 'Create account'}
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
