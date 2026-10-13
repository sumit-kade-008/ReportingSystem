// client/src/pages/SubmitReport.jsx
// Citizen report submission page with auto-route preview, GPS map picker, photo upload,
// and duplicate detection alert modal.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LocationPicker from '../components/map/LocationPicker';
import { CATEGORIES, SEVERITIES } from '../utils/constants';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Send,
  Building2,
  ShieldAlert,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';

// Client-side visual preview of category mapping
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
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [address, setAddress] = useState('Bengaluru Central');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const handleLocationChange = (lat, lng, addr) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addr) setAddress(addr);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const submitReport = async (force = false) => {
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('severity', severity);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('address', address);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (force) {
        formData.append('forceSubmit', 'true');
      }

      await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/my-reports');
    } catch (err) {
      console.error('Report submission failed:', err);
      if (err.response?.status === 409 && err.response?.data?.duplicateFound) {
        // Duplicate emergency found nearby!
        setDuplicateWarning(err.response.data);
      } else {
        setError(err.response?.data?.message || 'Failed to submit report. Please check required fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please attach an evidence photo of the infrastructure emergency.');
      return;
    }
    submitReport(false);
  };

  const predictedDepartment = CATEGORY_ROUTING_PREVIEW[category];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold mb-2 border border-red-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              Citizen Emergency Reporting
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Report Infrastructure Emergency
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your report will be automatically routed to the responsible department for quick resolution.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Report Form */}
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
              placeholder="e.g. Broken water pipeline flooding street near metro"
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* Category & Auto-assignment preview banner */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Emergency Category *
              </label>
              {/* Dynamic routing preview badge */}
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
              Detailed Description *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details such as landmarks, degree of obstruction, hazards, or immediate dangers..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            ></textarea>
          </div>

          {/* Location Picker Map */}
          <div>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={handleLocationChange}
            />
            <div className="mt-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Address or Landmark Description
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Specific street name, block, or nearest landmark"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </div>
          </div>

          {/* Photographic Evidence Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              Evidence Photograph (Required) *
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="w-full sm:w-auto flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition">
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Click to upload photo</span>
                <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, or WEBP (Max 10MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shadow shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Transmitting Emergency...' : 'Submit Emergency Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Detection Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Similar Emergency Already Logged!</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {duplicateWarning.message}
            </p>

            {duplicateWarning.existingReport && (
              <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-medium">Existing Report:</span>
                <p className="font-bold text-slate-800">{duplicateWarning.existingReport.title}</p>
                <span className="text-slate-500">Status: {duplicateWarning.existingReport.status}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-5">
              <button
                type="button"
                onClick={() => submitReport(true)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow"
              >
                Submit As Separate Emergency Anyway
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Cancel and Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitReport;
