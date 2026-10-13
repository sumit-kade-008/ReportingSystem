// client/src/components/common/Navbar.jsx
// Main navigation bar with role-aware links and interactive notification bell.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  LogOut,
  User,
  ShieldAlert,
  Building2,
  FileText,
  MapPin,
  BarChart3,
  PlusCircle,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'citizen') {
      fetchNotifications();
      // Poll every 30 seconds for live notification updates
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.role]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                EIRS
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-red-600/30 text-red-400 border border-red-500/30">
                  Emergency
                </span>
              </span>
              <p className="text-[11px] text-slate-400 -mt-1 hidden sm:block">Infrastructure Reporting</p>
            </div>
          </Link>

          {/* Navigation Links based on User Role */}
          <div className="hidden md:flex items-center gap-1.5">
            {isAuthenticated ? (
              <>
                {user.role === 'citizen' && (
                  <>
                    <Link
                      to="/submit-report"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/submit-report')
                          ? 'bg-red-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 text-red-400" />
                      Report Emergency
                    </Link>
                    <Link
                      to="/my-reports"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/my-reports')
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      My Reports
                    </Link>
                  </>
                )}

                {user.role === 'department' && (
                  <Link
                    to="/department"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                      isActive('/department')
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    {user.department} Department Dashboard
                  </Link>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/admin"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/admin')
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Admin Overview
                    </Link>
                    <Link
                      to="/admin/reports"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/admin/reports')
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      All City Reports
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/') ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Home
                </Link>
              </>
            )}
          </div>

          {/* Right Action Menu: Auth, Notifications, User Badge */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell (for citizen updates) */}
                {user.role === 'citizen' && (
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                      className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifDropdown && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-sm text-slate-900">Notifications</span>
                            {unreadCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif._id}
                                onClick={() => {
                                  setShowNotifDropdown(false);
                                  if (notif.report) {
                                    navigate(`/reports/${notif.report._id || notif.report}`);
                                  }
                                }}
                                className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                                  !notif.read ? 'bg-blue-50/50' : ''
                                }`}
                              >
                                <div className="mt-0.5">
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                                  <span className="text-[10px] text-slate-400 mt-1 block">
                                    {new Date(notif.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                {!notif.read && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(notif._id, e)}
                                    title="Mark as read"
                                    className="text-slate-400 hover:text-blue-600 self-center p-1"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User Role Badge & Info */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-white">{user.name}</p>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {user.role === 'department' ? `${user.department} Dept` : user.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
