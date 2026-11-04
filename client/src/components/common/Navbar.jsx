// client/src/components/common/Navbar.jsx
// Main navigation bar with role-aware text links and civic styling.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Bell, LogOut, Check, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'citizen') {
      fetchNotifications();
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
    <header className="bg-white border-b border-line sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark & Subtitle */}
          <Link to="/" className="flex flex-col text-left group">
            <span className="text-xl font-bold tracking-tight text-ink leading-tight">
              EIRS
            </span>
            <span className="text-xs text-ink-muted -mt-0.5">
              Emergency Infrastructure Reporting System
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 h-full">
            {isAuthenticated ? (
              <>
                {user.role === 'citizen' && (
                  <>
                    <Link
                      to="/submit-report"
                      className={`h-full inline-flex items-center text-sm font-medium border-b-2 transition ${
                        isActive('/submit-report')
                          ? 'border-accent text-accent font-semibold'
                          : 'border-transparent text-ink-muted hover:text-ink'
                      }`}
                    >
                      Submit report
                    </Link>
                    <Link
                      to="/my-reports"
                      className={`h-full inline-flex items-center text-sm font-medium border-b-2 transition ${
                        isActive('/my-reports')
                          ? 'border-accent text-accent font-semibold'
                          : 'border-transparent text-ink-muted hover:text-ink'
                      }`}
                    >
                      My reports
                    </Link>
                  </>
                )}

                {user.role === 'department' && (
                  <Link
                    to="/department"
                    className={`h-full inline-flex items-center text-sm font-medium border-b-2 transition ${
                      isActive('/department')
                        ? 'border-accent text-accent font-semibold'
                        : 'border-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    {user.department} department dashboard
                  </Link>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/admin"
                      className={`h-full inline-flex items-center text-sm font-medium border-b-2 transition ${
                        isActive('/admin')
                          ? 'border-accent text-accent font-semibold'
                          : 'border-transparent text-ink-muted hover:text-ink'
                      }`}
                    >
                      Overview
                    </Link>
                    <Link
                      to="/admin/reports"
                      className={`h-full inline-flex items-center text-sm font-medium border-b-2 transition ${
                        isActive('/admin/reports')
                          ? 'border-accent text-accent font-semibold'
                          : 'border-transparent text-ink-muted hover:text-ink'
                      }`}
                    >
                      All city reports
                    </Link>
                  </>
                )}
              </>
            ) : (
              <Link
                to="/"
                className={`h-full inline-flex items-center text-sm font-medium border-b-2 transition ${
                  isActive('/')
                    ? 'border-accent text-accent font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                Home
              </Link>
            )}
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell (citizen) */}
                {user.role === 'citizen' && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                      className="relative p-2 text-ink-muted hover:text-ink rounded border border-line hover:bg-surface transition"
                      aria-label="Notifications"
                    >
                      <Bell className="w-[18px] h-[18px]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[11px] font-semibold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifDropdown && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded border border-line shadow-dropdown text-ink z-50">
                        <div className="p-3 bg-surface border-b border-line flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink">Notifications</span>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              className="text-xs text-accent hover:underline font-medium"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-line">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-ink-muted text-sm">
                              No notifications
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
                                className={`p-3 text-left hover:bg-surface transition cursor-pointer flex items-start justify-between gap-2 ${
                                  !notif.read ? 'bg-accent-light/40' : ''
                                }`}
                              >
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-ink">{notif.title}</p>
                                  <p className="text-xs text-ink-muted mt-0.5 leading-normal">{notif.message}</p>
                                  <span className="text-[11px] text-ink-subtle mt-1 block">
                                    {new Date(notif.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                {!notif.read && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleMarkAsRead(notif._id, e)}
                                    title="Mark as read"
                                    className="text-ink-subtle hover:text-accent p-1"
                                  >
                                    <Check className="w-4 h-4" />
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

                {/* User Info & Logout Button */}
                <div className="flex items-center gap-2 pl-2 border-l border-line">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-ink leading-tight">{user.name}</p>
                    <p className="text-[11px] text-ink-muted capitalize">
                      {user.role === 'department' ? `${user.department} dept` : user.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign out"
                    className="p-2 sm:px-3 sm:py-1.5 rounded border border-line bg-white hover:bg-surface text-ink text-xs font-medium transition flex items-center gap-1.5 min-h-[36px]"
                  >
                    <LogOut className="w-[18px] h-[18px] text-ink-muted" />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded border border-line bg-white text-ink hover:bg-surface text-sm font-medium transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded border border-line text-ink hover:bg-surface"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-ink" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t border-line space-y-1">
            {isAuthenticated ? (
              <>
                {user.role === 'citizen' && (
                  <>
                    <Link
                      to="/submit-report"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded text-sm font-medium ${
                        isActive('/submit-report')
                          ? 'bg-accent-light text-accent font-semibold'
                          : 'text-ink hover:bg-surface'
                      }`}
                    >
                      Submit report
                    </Link>
                    <Link
                      to="/my-reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded text-sm font-medium ${
                        isActive('/my-reports')
                          ? 'bg-accent-light text-accent font-semibold'
                          : 'text-ink hover:bg-surface'
                      }`}
                    >
                      My reports
                    </Link>
                  </>
                )}

                {user.role === 'department' && (
                  <Link
                    to="/department"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded text-sm font-medium ${
                      isActive('/department')
                        ? 'bg-accent-light text-accent font-semibold'
                        : 'text-ink hover:bg-surface'
                    }`}
                  >
                    {user.department} department dashboard
                  </Link>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded text-sm font-medium ${
                        isActive('/admin')
                          ? 'bg-accent-light text-accent font-semibold'
                          : 'text-ink hover:bg-surface'
                      }`}
                    >
                      Overview
                    </Link>
                    <Link
                      to="/admin/reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded text-sm font-medium ${
                        isActive('/admin/reports')
                          ? 'bg-accent-light text-accent font-semibold'
                          : 'text-ink hover:bg-surface'
                      }`}
                    >
                      All city reports
                    </Link>
                  </>
                )}
              </>
            ) : (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded text-sm font-medium ${
                  isActive('/') ? 'bg-accent-light text-accent font-semibold' : 'text-ink hover:bg-surface'
                }`}
              >
                Home
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
