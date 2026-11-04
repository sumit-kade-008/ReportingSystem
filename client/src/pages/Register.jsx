// client/src/pages/Register.jsx
// Citizen registration page with civic styling.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register({ name, email, password, phone });
      navigate('/my-reports');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Title */}
        <div className="text-left space-y-1">
          <h1 className="text-2xl font-semibold text-ink">Create a citizen account</h1>
          <p className="text-sm text-ink-muted">
            Register to report infrastructure issues and track repair progress.
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
              <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
                Full name <span className="text-xs text-ink-muted font-normal">(required)</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>

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
                placeholder="rahul@example.com"
                className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-ink mb-1">
                Phone number <span className="text-xs text-ink-muted font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
                Password <span className="text-xs text-ink-muted font-normal">(required, min 6 characters)</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
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
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="pt-2 text-center text-sm text-ink-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
