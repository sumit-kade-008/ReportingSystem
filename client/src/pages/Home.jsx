// client/src/pages/Home.jsx
// Landing page with emergency statistics, auto-routing architecture diagram, and quick access portals.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldAlert,
  ArrowRight,
  Zap,
  Building2,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
  PhoneCall,
  Flame,
  Droplets,
  TreeDeciduous,
  Trash2,
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState({ total: 8, resolved: 1, inProgress: 1, pending: 2 });

  useEffect(() => {
    // Optionally fetch public health/stats if available
    api
      .get('/health')
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-red-500 selection:text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/30 via-slate-900/80 to-slate-900 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/20 text-red-400 text-xs font-bold border border-red-500/30 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            Urban Emergency Infrastructure Reporting System (EIRS)
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            Report Public Hazards. <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Auto-Assigned In Real Time.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            A centralized civic emergency platform connecting citizens with 7 municipal response departments.
            Pin hazards with GPS, upload evidence, and monitor field crew resolution timelines.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to={isAuthenticated ? (user.role === 'citizen' ? '/submit-report' : user.role === 'department' ? '/department' : '/admin') : '/login'}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-sm font-bold shadow-xl shadow-red-600/30 transition flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Report Emergency Incident
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
            >
              Department & Admin Login
            </Link>
          </div>
        </div>
      </div>

      {/* Feature 1: The Auto-Routing Engine (Viva Showcase) */}
      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Intelligent Civic Infrastructure
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Category-Based Auto-Assignment Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Zero bottleneck: Incoming emergency reports are routed to specialized municipal departments instantly.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
              🚧
            </div>
            <h4 className="text-xs font-bold text-white">Pothole / Road</h4>
            <span className="text-[10px] text-orange-400 font-semibold block">➔ Road Dept</span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h4 className="text-xs font-bold text-white">Electric Pole</h4>
            <span className="text-[10px] text-amber-400 font-semibold block">➔ Electricity Dept</span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <Droplets className="w-5 h-5 text-cyan-400" />
            </div>
            <h4 className="text-xs font-bold text-white">Water Leakage</h4>
            <span className="text-[10px] text-cyan-400 font-semibold block">➔ Water Dept</span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <TreeDeciduous className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold text-white">Fallen Tree</h4>
            <span className="text-[10px] text-emerald-400 font-semibold block">➔ Tree Dept</span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
              🌊
            </div>
            <h4 className="text-xs font-bold text-white">Drainage Block</h4>
            <span className="text-[10px] text-teal-400 font-semibold block">➔ Drainage Dept</span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            <h4 className="text-xs font-bold text-white">Fire Hazard</h4>
            <span className="text-[10px] text-red-400 font-semibold block">➔ Fire Dept</span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-lime-500/20 text-lime-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-lime-400" />
            </div>
            <h4 className="text-xs font-bold text-white">Garbage Dump</h4>
            <span className="text-[10px] text-lime-400 font-semibold block">➔ Sanitation Dept</span>
          </div>

          <div className="bg-purple-950/40 p-4 rounded-2xl border border-purple-800/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              ⚖️
            </div>
            <h4 className="text-xs font-bold text-white">Traffic, Bridge, Other</h4>
            <span className="text-[10px] text-purple-300 font-semibold block">➔ Admin Triage</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>EIRS - Emergency Infrastructure Reporting System • Built for College Academic Viva & Demonstration</p>
      </div>
    </div>
  );
};

export default Home;
