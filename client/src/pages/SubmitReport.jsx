// client/src/pages/SubmitReport.jsx
// Citizen emergency reporting page enforcing Live Camera capture, high-accuracy GPS verification,
// and collaborative duplicate resolution modal (no bypass option).

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import LiveCamera from '../components/reports/LiveCamera';
import LiveLocation from '../components/reports/LiveLocation';
import { CATEGORIES, SEVERITIES, STATUS_COLORS, SEVERITY_COLORS } from '../utils/constants';
import {
  ShieldAlert,
  Send,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Users,
  Eye,
  ArrowRight,
  Clock,
  Home,
  X,
} from 'lucide-react';

const CATEGORY_ROUTING_PREVIEW = {
  Pothole: 'Road',
  Road: 'Road',
  'Electric Pole': 'Electricity',
  'Water Leakage': 'Water',
  Drainage: 'Drainage',
  'Fallen Tree': 'Tree',
  Fire: 'Fire',
  Garbage: 'Sanitation',
};

const SubmitReport = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [severity, setSeverity] = useState('Medium');

  // Live Location State
  const [locationData, setLocationData] = useState(null); // { latitude, longitude, accuracy, address }
  const [locationError, setLocationError] = useState('');

  // Live Camera Photo State
  const [photoData, setPhotoData] = useState(null); // { blob, capturedAt, previewUrl }

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Duplicate Live Modal State
  const [duplicateModal, setDuplicateModal] = useState(null); // { duplicate: true, alreadyReported: boolean, report: object, message: string }

  const handleLocationDetected = (loc) => {
    setLocationData(loc);
    setLocationError('');
  };

  const handleLocationInvalid = (err) => {
    setLocationData(null);
    setLocationError(err);
  };

  const handlePhotoCaptured = (photo) => {
    setPhotoData(photo);
    setFormError('');
  };

  const handlePhotoCleared = () => {
    setPhotoData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!photoData || !photoData.blob) {
      setFormError('Please capture a live photo of the emergency using the camera.');
      return;
    }

    if (!locationData || locationData.accuracy > 100) {
      setFormError('High-accuracy GPS location (< 100m) is required to prevent fraudulent reporting.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('severity', severity);
      formData.append('latitude', locationData.latitude);
      formData.append('longitude', locationData.longitude);
      formData.append('accuracy', locationData.accuracy);
      formData.append('address', locationData.address);
      formData.append('capturedAt', photoData.capturedAt);
      formData.append('image', photoData.blob, `live-capture-${Date.now()}.jpg`);

      const res = await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.duplicate) {
        // Collaborative Duplicate Detected: Open Live Emergency Modal
        setDuplicateModal({
          duplicate: true,
          alreadyReported: false,
          report: res.data.report,
          message: res.data.message,
        });
      } else {
        // Newly created emergency
        navigate('/my-reports');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      if (err.response?.status === 409 && err.response?.data?.duplicate) {
        // Citizen already reported this incident
        setDuplicateModal({
          duplicate: true,
          alreadyReported: true,
          report: err.response.data.report,
          message: err.response.data.message || 'You have already reported this emergency',
        });
      } else {
        setFormError(err.response?.data?.message || 'Failed to submit report. Please retry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const predictedDepartment = CATEGORY_ROUTING_PREVIEW[category];
  const isSubmitReady = !!photoData && !!locationData && locationData.accuracy <= 100;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold mb-2 border border-red-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            Verified Incident Reporting
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report Infrastructure Emergency
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Anti-fraud enabled: live sensor capture, watermarked evidence, and instant department auto-routing.
          </p>
        </div>

        {formError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Emergency Title / Brief Summary *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dangerously exposed transformer wire sparking near school"
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* Category with Auto-assignment indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Emergency Category *
              </label>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-slate-400">Target:</span>
                {predictedDepartment ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Auto-assigns to {predictedDepartment} Dept
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Admin Triage (Pending)
                  </span>
                )}
              </div>
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Severity Level *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SEVERITIES.map((sev) => {
                const isSelected = severity === sev;
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? sev === 'Critical'
                          ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-400'
                          : sev === 'High'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-400'
                          : sev === 'Medium'
                          ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-400'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ● {sev}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Hazard Description *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State degree of hazard, vehicle blockage, live sparks, water pressure, or nearby landmarks..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            ></textarea>
          </div>

          {/* Step 1: Live GPS Location Verification (Read-Only) */}
          <LiveLocation
            onLocationDetected={handleLocationDetected}
            onLocationInvalid={handleLocationInvalid}
          />

          {/* Step 2: Live Camera Capture Only (Watermarked) */}
          <LiveCamera
            latitude={locationData?.latitude}
            longitude={locationData?.longitude}
            accuracy={locationData?.accuracy}
            onPhotoCaptured={handlePhotoCaptured}
            onPhotoCleared={handlePhotoCleared}
          />

          {/* Verification Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Anti-Fraud Readiness Checklist:
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${locationData && locationData.accuracy <= 100 ? 'text-emerald-500' : 'text-slate-300'}`}
              />
              <span className={locationData && locationData.accuracy <= 100 ? 'text-slate-800 font-semibold' : 'text-slate-500'}>
                {locationData
                  ? `Live GPS Acquired (±${Math.round(locationData.accuracy)}m)`
                  : 'Acquiring high-accuracy GPS fix...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${photoData ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span className={photoData ? 'text-slate-800 font-semibold' : 'text-slate-500'}>
                {photoData ? 'Live Watermarked Photo Captured' : 'Take live camera photo'}
              </span>
            </div>
          </div>

          {/* Submit Button (stays disabled until both photo & GPS are ready) */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
            <button
              type="submit"
              disabled={!isSubmitReady || submitting}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg transition flex items-center justify-center gap-2 ${
                isSubmitReady && !submitting
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 hover:scale-[1.02]'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              {submitting
                ? 'Verifying & Transmitting...'
                : !isSubmitReady
                ? 'Capture Photo & High-Accuracy GPS to Submit'
                : 'Transmit Emergency Report'}
            </button>
          </div>
        </form>
      </div>

      {/* CHANGE 1: "This Emergency Is Already Reported and Live" Modal */}
      {duplicateModal && duplicateModal.report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-blue-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Crowd-Verified Civic Incident
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-snug mt-0.5">
                  This Emergency Is Already Reported and Live
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 font-medium">
              {duplicateModal.alreadyReported
                ? 'You have already reported this emergency. Your tracking link is below.'
                : 'An identical emergency was already logged within 50 meters! Your live photo and GPS have been attached as additional evidence, increasing incident priority.'}
            </p>

            {/* Existing Live Report Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
              <div className="flex items-start gap-3">
                {duplicateModal.report.imageUrl && (
                  <img
                    src={duplicateModal.report.imageUrl}
                    alt="Original Emergency"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">
                    {duplicateModal.report.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[duplicateModal.report.status]}`}>
                      Status: {duplicateModal.report.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                      {duplicateModal.report.department} Dept
                    </span>
                  </div>
                </div>
              </div>

              {/* Crowd confirmation counter */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                <span className="flex items-center gap-1 font-bold text-slate-800">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Reported by {duplicateModal.report.reportCount || 1} citizen{(duplicateModal.report.reportCount || 1) > 1 ? 's' : ''}
                </span>
                <span className="text-slate-400">ID: #{duplicateModal.report._id.slice(-6)}</span>
              </div>

              {/* Mini Status Timeline */}
              {duplicateModal.report.statusHistory && duplicateModal.report.statusHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Live Timeline:</span>
                  <div className="space-y-1">
                    {duplicateModal.report.statusHistory.slice(-2).map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-medium">• {h.status}</span>
                        <span className="text-slate-400">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons (NO "submit anyway" option) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/reports/${duplicateModal.report._id}`)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Track This Report
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitReport;
