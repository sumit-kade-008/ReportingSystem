// client/src/App.jsx
// Root application with React Router and role-based route guards.

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SubmitReport from './pages/SubmitReport';
import MyReports from './pages/MyReports';
import ReportDetails from './pages/ReportDetails';
import DepartmentDashboard from './pages/DepartmentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Citizen Protected Routes */}
              <Route
                path="/submit-report"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <SubmitReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-reports"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <MyReports />
                  </ProtectedRoute>
                }
              />

              {/* Shared Report Details (citizen, department, admin) */}
              <Route
                path="/reports/:id"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'department', 'admin']}>
                    <ReportDetails />
                  </ProtectedRoute>
                }
              />

              {/* Department Dashboard (department only) */}
              <Route
                path="/department"
                element={
                  <ProtectedRoute allowedRoles={['department']}>
                    <DepartmentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes (admin only) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminReports />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
