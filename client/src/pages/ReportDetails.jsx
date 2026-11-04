// client/src/pages/ReportDetails.jsx
// Detailed report inspection view featuring lifecycle timeline, evidence photos, and feedback.

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReportMap from '../components/map/ReportMap';
import { SEVERITY_COLORS, STATUS_COLORS, DEPARTMENT_COLORS } from '../utils/constants';
import { ArrowLeft, Star } from 'lucide-react';

const ReportDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Rating & Feedback form state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  const fetchReportDetails = async () => {
    try {
      const res = await api.get(`/reports/${id}`);
      setReport(res.data.report);
      if (res.data.report.feedback?.rating) {
        setRating(res.data.report.feedback.rating);
        setFeedbackComment(res.data.report.feedback.comment || '');
      }
    } catch (err) {
      console.error('Failed to fetch report details:', err);
      setError(err.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setFeedbackSuccess('');
    try {
      await api.post(`/reports/${id}/feedback`, {
        rating,
        comment: feedbackComment,
      });
      setFeedbackSuccess('Thank you. Your feedback has been recorded.');
      fetchReportDetails();
    } catch (err) {
      console.error('Feedback failed:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getBackPath = () => {
    if (user?.role === 'department') return '/department';
    if (user?.role === 'admin') return '/admin';
    return '/my-reports';
  };

  if (loading) {
    return (
      <div className="bg-surface min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-ink-muted">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading report details...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-surface min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded border border-line text-left max-w-md w-full space-y-3">
          <h2 className="font-semibold text-base text-ink">Unable to view report</h2>
          <p className="text-sm text-ink-muted">{error || 'Report not found.'}</p>
          <div className="pt-2">
            <Link
              to={getBackPath()}
              className="inline-flex items-center justify-center px-4 py-2 rounded border border-line bg-white hover:bg-surface text-ink text-sm font-medium transition"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = user?.id || user?._id;
  const isOriginalReporter = report.citizen?._id?.toString() === currentUserId?.toString();
  const isLinkedReporter = (report.reportedBy || []).some(
    (u) => (u._id || u).toString() === currentUserId?.toString()
  );
  const canSubmitFeedback = user?.role === 'citizen' && (isOriginalReporter || isLinkedReporter);

  return (
    <div className="bg-surface min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to={getBackPath()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to reports
          </Link>
          <span className="text-xs font-mono text-ink-subtle">
            Report #{report._id.slice(-8)}
          </span>
        </div>

        {/* Overview Header */}
        <div className="bg-white p-6 sm:p-8 rounded border border-line space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs px-2.5 py-0.5 rounded-sm font-medium border ${STATUS_COLORS[report.status]}`}>
              {report.status}
            </span>

            <span className={`text-xs px-2.5 py-0.5 rounded-sm font-medium border ${SEVERITY_COLORS[report.severity]}`}>
              {report.severity} severity
            </span>

            <span className={`text-xs px-2.5 py-0.5 rounded-sm font-medium border ${DEPARTMENT_COLORS[report.department] || 'border-line'}`}>
              {report.department} Department
            </span>

            {report.reportCount > 1 && (
              <span className="text-xs px-2.5 py-0.5 rounded-sm font-medium border border-line bg-surface text-ink-muted">
                Confirmed by {report.reportCount} citizens
              </span>
            )}
          </div>

          <h1 className="text-2xl font-semibold text-ink leading-snug">
            {report.title}
          </h1>

          <div className="p-4 rounded border border-line bg-surface text-sm text-ink leading-relaxed">
            {report.description}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted pt-2 border-t border-line">
            <span>
              Reported by: <span className="font-medium text-ink">{report.citizen?.name || 'Citizen'}</span>
            </span>
            <span>•</span>
            <span>Date: {new Date(report.createdAt).toLocaleString()}</span>
            <span>•</span>
            <span>
              Location: {report.location?.address} (accurate to ~{Math.round(report.accuracy || 10)}m)
            </span>
          </div>
        </div>

        {/* Evidence Photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submitted Photo */}
          <div className="bg-white p-4 rounded border border-line space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Photo submitted with report</h2>
              <span className="text-xs text-ink-muted">Initial submission</span>
            </div>
            {report.imageUrl ? (
              <img
                src={report.imageUrl}
                alt="Submitted problem evidence"
                className="w-full h-60 object-cover rounded border border-line"
              />
            ) : (
              <div className="w-full h-60 bg-surface rounded border border-line flex items-center justify-center text-xs text-ink-muted">
                No initial photo available
              </div>
            )}
          </div>

          {/* Department Resolution Photo */}
          <div className="bg-white p-4 rounded border border-line space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Department resolution photo</h2>
              <span className="text-xs text-ink-muted">
                {report.status === 'Resolved' ? 'Completed work' : 'Pending resolution'}
              </span>
            </div>
            {report.resolvedProofUrl ? (
              <img
                src={report.resolvedProofUrl}
                alt="Resolution proof"
                className="w-full h-60 object-cover rounded border border-line"
              />
            ) : (
              <div className="w-full h-60 bg-surface rounded border border-line flex flex-col items-center justify-center text-xs text-ink-muted p-4 text-center">
                <span>Work is pending or in progress.</span>
                <span className="text-[11px] text-ink-subtle mt-1">Resolution photo will appear once field crew marks resolved.</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Citizen Confirmations */}
        {report.confirmations && report.confirmations.length > 0 && (
          <div className="bg-white p-6 rounded border border-line space-y-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Additional citizen confirmations ({report.confirmations.length})
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Extra photos and locations confirmed by other citizens near this site.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {report.confirmations.map((conf, idx) => (
                <div key={idx} className="p-3 bg-surface rounded border border-line space-y-2">
                  <img
                    src={conf.imageUrl}
                    alt={`Confirmation ${idx + 1}`}
                    className="w-full h-32 object-cover rounded border border-line"
                  />
                  <div className="text-xs text-ink-muted space-y-0.5">
                    <p className="font-medium text-ink">Confirmed by {conf.citizen?.name || 'Citizen'}</p>
                    <p className="text-[11px]">{new Date(conf.capturedAt).toLocaleString()}</p>
                    <p className="font-mono text-[10px] text-ink-subtle">
                      {conf.latitude?.toFixed(4)}, {conf.longitude?.toFixed(4)} (±{Math.round(conf.accuracy || 10)}m)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes & Location Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Field Notes */}
          <div className="bg-white p-5 rounded border border-line space-y-3">
            <h2 className="text-sm font-semibold text-ink">Department field notes</h2>
            {report.workNotes ? (
              <div className="p-3 bg-surface rounded border border-line text-sm text-ink leading-relaxed">
                "{report.workNotes}"
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No department notes entered yet.</p>
            )}

            {report.adminNotes && (
              <div className="pt-2 border-t border-line space-y-1">
                <span className="text-xs font-medium text-ink-muted">Administrative triage note</span>
                <p className="p-2.5 bg-surface rounded border border-line text-xs text-ink">
                  {report.adminNotes}
                </p>
              </div>
            )}
          </div>

          {/* Map Pin */}
          <div className="bg-white p-5 rounded border border-line space-y-2">
            <h2 className="text-sm font-semibold text-ink">Incident location</h2>
            <div className="h-44 rounded overflow-hidden border border-line">
              <ReportMap reports={[report]} height="100%" zoom={14} />
            </div>
          </div>
        </div>

        {/* Lifecycle Progress Timeline */}
        <div className="bg-white p-6 sm:p-8 rounded border border-line space-y-4">
          <div className="border-b border-line pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">Progress timeline</h2>
              <p className="text-xs text-ink-muted">Audit history from report submission to resolution</p>
            </div>
            <span className="text-xs text-ink-muted">
              {report.statusHistory?.length || 0} updates
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
            {report.statusHistory && report.statusHistory.length > 0 ? (
              report.statusHistory.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white bg-accent"></div>
                  <div className="p-3 bg-surface rounded border border-line space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-sm font-medium border ${STATUS_COLORS[step.status]}`}>
                          {step.status}
                        </span>
                        <span className="text-xs text-ink-muted capitalize">
                          by {step.role} {step.changedBy?.department ? `(${step.changedBy.department} Department)` : ''}
                        </span>
                      </div>
                      <span className="text-xs text-ink-subtle">
                        {new Date(step.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {step.note && (
                      <p className="text-xs text-ink mt-1.5 p-2 bg-white rounded border border-line">
                        {step.note}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-muted">No timeline entries yet.</p>
            )}
          </div>
        </div>

        {/* Citizen Rating & Feedback (if Resolved) */}
        {report.status === 'Resolved' && (
          <div className="bg-white p-6 sm:p-8 rounded border border-line space-y-4">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Resolution feedback
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Rate the quality and speed of repair work performed by {report.department} Department.
              </p>
            </div>

            {feedbackSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-sm font-medium">
                {feedbackSuccess}
              </div>
            )}

            {canSubmitFeedback ? (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Rating (1 to 5 stars)
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className="p-1 focus:outline-none transition"
                        aria-label={`${num} star`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            num <= rating ? 'fill-amber-500 text-amber-500' : 'text-line-dark'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-ink-muted ml-2">{rating} of 5 stars</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="feedbackComment" className="block text-sm font-medium text-ink mb-1">
                    Comments <span className="text-xs text-ink-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="feedbackComment"
                    rows={2}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Provide any feedback on the repair or response time."
                    className="w-full px-3 py-2 text-base bg-white border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition min-h-[44px]"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit feedback'}
                </button>
              </form>
            ) : report.feedback?.rating ? (
              <div className="p-3 bg-surface rounded border border-line text-sm space-y-1">
                <div className="flex items-center gap-1 text-amber-600 font-medium">
                  {[...Array(report.feedback.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="ml-1 text-ink">{report.feedback.rating} / 5</span>
                </div>
                {report.feedback.comment && (
                  <p className="text-ink-muted text-xs mt-1">"{report.feedback.comment}"</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No rating submitted yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetails;
