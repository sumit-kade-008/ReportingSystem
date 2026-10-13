// client/src/services/api.js
// Axios instance configured with JWT token interceptor and centralized error handler.

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor: Automatically attaches JWT Bearer token if stored in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eirs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Catches 401 unauthenticated errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized token, clear token and state
      localStorage.removeItem('eirs_token');
      localStorage.removeItem('eirs_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
