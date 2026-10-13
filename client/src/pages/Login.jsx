// client/src/pages/Login.jsx
// Unified login page with role-based routing and viva quick-fill testing buttons.

import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, Lock, Mail, Building2, UserCheck, ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login, getRedirectPathByRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(email, password);
      const redirectPath = location.state?.from?.pathname || getRedirectPathByRole(user.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick fill helper for presentation/viva
  const quickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign In to EIRS
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Emergency Infrastructure Reporting System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@eirs.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials (Viva Assistant) */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Quick Fill Test Accounts (Viva Demo)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickFill('electricity@eirs.com', 'password123')}
                className="p-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 font-semibold hover:bg-amber-100 transition flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Electricity Dept
              </button>
              <button
                type="button"
                onClick={() => quickFill('water@eirs.com', 'password123')}
                className="p-2 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-900 font-semibold hover:bg-cyan-100 transition flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                Water Dept
              </button>
              <button
                type="button"
                onClick={() => quickFill('admin@eirs.com', 'admin123')}
                className="p-2 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 font-semibold hover:bg-purple-100 transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                Municipal Admin
              </button>
              <button
                type="button"
                onClick={() => quickFill('rahul@gmail.com', 'citizen123')}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Citizen (Rahul)
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have a citizen account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
