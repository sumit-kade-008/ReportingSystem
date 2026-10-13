// client/src/components/common/ProtectedRoute.jsx
// Route wrapper that guards pages according to authentication and user role.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getRedirectPathByRole } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 font-medium">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user does not have permission, redirect to their role's home view
    const fallback = getRedirectPathByRole(user.role);
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
