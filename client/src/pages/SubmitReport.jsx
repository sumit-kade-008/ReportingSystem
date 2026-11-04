// client/src/pages/SubmitReport.jsx
// Citizen infrastructure reporting form with live camera, GPS verification, and duplicate resolution modal.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LiveCamera from '../components/reports/LiveCamera';
import LiveLocation from '../components/reports/LiveLocation';
import { CATEGORIES, SEVERITIES, STATUS_COLORS } from '../utils/constants';

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

const SEVERITY_LEFT_BORDERS = {
  Low: 'border-l-emerald-600',
  Medium: 'border-l-amber-500',
  High: 'border-l-orange-500',
  Critical: 'border-l-red-600',
};

const SubmitReport = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [severity, setSeverity] = useState('Medium');

  const [locationData, setLocationData] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [photoData, setPhotoData] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [duplicateModal, setDuplicateModal] = useState(null);

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
      setFormError('Please take a live photo of the problem using your camera.');
      return;
    }

    if (!locationData || locationData.accuracy > 100) {
      setFormError('Accurate location within 100 meters is required to submit a report.');
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
        setDuplicateModal({
          duplicate: true,
          alreadyReported: false,
          report: res.data.report,
          message: res.data.message,
        });
      } else {
        navigate('/my-reports');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      if (err.response?.status === 409 && err.response?.data?.duplicate) {
        setDuplicateModal({
          duplicate: true,
          alreadyReported: true,
          report: err.response.data.report,
          message: err.response.data.message || 'You have already reported this issue.',
        });
      } else {
        setFormError(err.response?.data?.message || 'Failed to submit report. Please check your information and retry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const predictedDepartment = CATEGORY_ROUTING_PREVIEW[category];
  const isSubmitReady = !!photoData && !!locationData && locationData.accuracy <= 100;

  return (
    <div className="bg-surface min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded border border-line text-left space-y-1">
          <h1 className="text-2xl font-semibold text-ink">
            Submit an infrastructure report
          </h1>
          <p className="text-sm text-ink-muted">
            Provide the details, exact location, and a live photo of the issue so it can be dispatched to the responsible municipal department.
          </p>
        </div>

        {formError && (
          <div className="p-3.5 rounded border border-red-200 bg-red-50 text-sm text-red-800 text-left">
            {formError}
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded border border-line space-y-6 text-left">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-ink mb-1">
              Title or summary <span className="text-xs text-ink-muted font-normal">(required)</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken water pipe leaking onto sidewalk"
              className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent min-h-[44px]"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="category" className="block text-sm font-medium text-ink">
                Category <span className="text-xs text-ink-muted font-normal">(required)</span>
              </label>
              <span className="text-xs text-ink-muted">
                {predictedDepartment
                  ? `Routes to ${predictedDepartment} Department`
                  : 'Requires administrative triage'}
              </span>
            </div>

            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink focus:outline-none focus:border-accent min-h-[44px]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Severity (Segmented control with colored left border) */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Severity level <span className="text-xs text-ink-muted font-normal">(required)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITIES.map((sev) => {
                const isSelected = severity === sev;
                const leftBorderColor = SEVERITY_LEFT_BORDERS[sev] || 'border-l-line';
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-3 rounded border text-sm text-left transition min-h-[44px] border-l-4 ${leftBorderColor} ${
                      isSelected
                        ? 'border-accent bg-accent-light/50 font-semibold text-ink'
                        : 'border-line bg-white text-ink hover:bg-surface font-normal'
                    }`}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">
              Description <span className="text-xs text-ink-muted font-normal">(required)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the condition, exact spot, hazard level, or relevant landmarks."
              className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
            ></textarea>
          </div>

          {/* Location Verification */}
          <div className="pt-2 border-t border-line">
            <LiveLocation
              onLocationDetected={handleLocationDetected}
              onLocationInvalid={handleLocationInvalid}
            />
          </div>

          {/* Camera Photo */}
          <div className="pt-2 border-t border-line">
            <LiveCamera
              latitude={locationData?.latitude}
              longitude={locationData?.longitude}
              accuracy={locationData?.accuracy}
              onPhotoCaptured={handlePhotoCaptured}
              onPhotoCleared={handlePhotoCleared}
            />
          </div>

          {/* Readiness Checklist */}
          <div className="p-3 rounded border border-line bg-surface text-xs space-y-1.5 text-ink-muted">
            <span className="font-semibold text-ink block">Submission readiness:</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${locationData && locationData.accuracy <= 100 ? 'bg-emerald-600' : 'bg-line-dark'}`} />
              <span className={locationData && locationData.accuracy <= 100 ? 'text-ink font-medium' : ''}>
                {locationData && locationData.accuracy <= 100
                  ? `Location verified within ${Math.round(locationData.accuracy)}m`
                  : 'Location not verified yet'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${photoData ? 'bg-emerald-600' : 'bg-line-dark'}`} />
              <span className={photoData ? 'text-ink font-medium' : ''}>
                {photoData ? 'Photo captured' : 'Photo required'}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-line flex items-center justify-end">
            <button
              type="submit"
              disabled={!isSubmitReady || submitting}
              className={`w-full sm:w-auto px-6 py-2.5 rounded text-sm font-medium transition min-h-[44px] ${
                isSubmitReady && !submitting
                  ? 'bg-accent hover:bg-accent-hover text-white'
                  : 'bg-line-subtle text-ink-muted border border-line cursor-not-allowed'
              }`}
            >
              {submitting
                ? 'Submitting report...'
                : !isSubmitReady
                ? 'Location and photo required to submit'
                : 'Submit report'}
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Found Modal */}
      {duplicateModal && duplicateModal.report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="bg-white rounded max-w-lg w-full p-6 border border-line shadow-modal space-y-4 text-left">
            <div>
              <h3 className="text-lg font-semibold text-ink">
                This issue has already been reported nearby
              </h3>
              <p className="text-sm text-ink-muted mt-1 leading-normal">
                {duplicateModal.alreadyReported
                  ? 'You have already submitted a report for this issue. You can track its progress below.'
                  : 'An active report was already registered within 50 meters of your location. Your photo has been added to support the existing report.'}
              </p>
            </div>

            {/* Existing Report Card */}
            <div className="p-3 rounded border border-line bg-surface space-y-2 text-xs">
              <div className="flex items-start gap-3">
                {duplicateModal.report.imageUrl && (
                  <img
                    src={duplicateModal.report.imageUrl}
                    alt="Existing issue"
                    className="w-16 h-16 rounded object-cover border border-line shrink-0"
                  />
                )}
                <div className="space-y-1">
                  <h4 className="font-semibold text-ink text-sm">
                    {duplicateModal.report.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_COLORS[duplicateModal.report.status]}`}>
                      Status: {duplicateModal.report.status}
                    </span>
                    <span className="text-ink-muted">
                      {duplicateModal.report.department} Department
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-line text-ink-muted flex items-center justify-between">
                <span>
                  Reported by {duplicateModal.report.reportCount || 1} citizen{(duplicateModal.report.reportCount || 1) > 1 ? 's' : ''}
                </span>
                <span>ID: #{duplicateModal.report._id.slice(-6)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-4 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition min-h-[44px]"
              >
                Return to home
              </button>

              <button
                type="button"
                onClick={() => navigate(`/reports/${duplicateModal.report._id}`)}
                className="w-full sm:w-auto px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px]"
              >
                Track this report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitReport;
