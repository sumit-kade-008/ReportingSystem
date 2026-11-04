// client/src/pages/Home.jsx
// Municipal landing page explaining the infrastructure reporting and department routing workflow.

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ROUTING_CATEGORIES = [
  { category: 'Pothole and road damage', department: 'Road Department' },
  { category: 'Electric pole and wiring', department: 'Electricity Department' },
  { category: 'Water pipe leakage', department: 'Water Department' },
  { category: 'Fallen tree or branch', department: 'Tree Department' },
  { category: 'Drainage and sewage blockage', department: 'Drainage Department' },
  { category: 'Fire hazard', department: 'Fire Department' },
  { category: 'Garbage accumulation', department: 'Sanitation Department' },
  { category: 'Traffic signals and bridges', department: 'Administrative Triage' },
];

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    api.get('/health').catch(() => {});
  }, []);

  const getReportLink = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'citizen') return '/submit-report';
    if (user?.role === 'department') return '/department';
    return '/admin';
  };

  return (
    <div className="bg-surface min-h-[calc(100vh-64px)] text-ink">
      {/* Hero Section */}
      <section className="bg-white border-b border-line py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4 text-left">
          <p className="text-sm font-medium text-ink-muted">
            City Infrastructure Services
          </p>

          <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight leading-tight">
            Emergency Infrastructure Reporting System
          </h1>

          <p className="text-base text-ink-muted max-w-2xl leading-relaxed">
            Report public infrastructure damage or safety hazards directly to city services.
            Every submission requires verified camera evidence and accurate location data to route
            the report directly to the correct department.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              to={getReportLink()}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px]"
            >
              Submit a report
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[44px]"
            >
              Staff and department sign in
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">Department routing guide</h2>
          <p className="text-sm text-ink-muted mt-1">
            Reports are assigned automatically based on the reported incident category.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROUTING_CATEGORIES.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded border border-line text-left space-y-1.5"
            >
              <h3 className="text-sm font-medium text-ink">{item.category}</h3>
              <p className="text-xs text-ink-muted">Assigned to</p>
              <p className="text-xs font-semibold text-accent">{item.department}</p>
            </div>
          ))}
        </div>

        {/* Process overview */}
        <div className="bg-white p-6 rounded border border-line mt-8 space-y-4">
          <h2 className="text-base font-semibold text-ink">How reports are handled</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-ink-muted">
            <div className="space-y-1">
              <span className="font-semibold text-ink block">1. Take a live photo and location</span>
              <p className="text-xs leading-relaxed">
                Photos are captured directly in the browser to ensure real-time accuracy and location verification.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-ink block">2. Automatic department dispatch</span>
              <p className="text-xs leading-relaxed">
                The report appears immediately on the responsible department's queue for crew assignment.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-ink block">3. Resolution tracking</span>
              <p className="text-xs leading-relaxed">
                Follow status updates, review field notes, and see photo proof once the work is completed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-6 text-center text-xs text-ink-muted">
        <p>EIRS • Emergency Infrastructure Reporting System</p>
      </footer>
    </div>
  );
};

export default Home;
