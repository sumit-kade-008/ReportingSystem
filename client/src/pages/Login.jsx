// client/src/pages/Login.jsx
// Sign-in page with civic styling and demo test accounts.

import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  const quickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="bg-surface min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Title */}
        <div className="text-left space-y-1">
          <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
          <p className="text-sm text-ink-muted">
            Access your citizen reports or municipal department workspace.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded border border-line space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
                Email address <span className="text-xs text-ink-muted font-normal">(required)</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
                Password <span className="text-xs text-ink-muted font-normal">(required)</span>
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px] disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-line space-y-2 text-left">
            <p className="text-xs font-medium text-ink-muted">
              Demo test accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickFill('rahul@gmail.com', 'citizen123')}
                className="p-2 rounded border border-line bg-surface hover:bg-white text-ink text-left font-medium transition min-h-[44px]"
              >
                <span className="block font-semibold">Citizen</span>
                <span className="text-ink-muted text-[11px]">Rahul Sharma</span>
              </button>

              <button
                type="button"
                onClick={() => quickFill('electricity@eirs.com', 'password123')}
                className="p-2 rounded border border-line bg-surface hover:bg-white text-ink text-left font-medium transition min-h-[44px]"
              >
                <span className="block font-semibold">Electricity Dept</span>
                <span className="text-ink-muted text-[11px]">Department Staff</span>
              </button>

              <button
                type="button"
                onClick={() => quickFill('water@eirs.com', 'password123')}
                className="p-2 rounded border border-line bg-surface hover:bg-white text-ink text-left font-medium transition min-h-[44px]"
              >
                <span className="block font-semibold">Water Dept</span>
                <span className="text-ink-muted text-[11px]">Department Staff</span>
              </button>

              <button
                type="button"
                onClick={() => quickFill('admin@eirs.com', 'admin123')}
                className="p-2 rounded border border-line bg-surface hover:bg-white text-ink text-left font-medium transition min-h-[44px]"
              >
                <span className="block font-semibold">Municipal Admin</span>
                <span className="text-ink-muted text-[11px]">Administrator</span>
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-sm text-ink-muted">
            Do not have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
