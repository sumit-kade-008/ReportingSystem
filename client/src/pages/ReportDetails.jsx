// client/src/pages/ReportDetails.jsx
// Detailed report inspection view featuring the visual progress timeline (statusHistory),
// crowd confirmations & extra evidence photos, and citizen rating/feedback submission.

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReportMap from '../components/map/ReportMap';
import { SEVERITY_COLORS, STATUS_COLORS, DEPARTMENT_COLORS } from '../utils/constants';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  User,
  Star,
  Send,
  FileCheck,
  ShieldAlert,
  Users,
  ShieldCheck,
} from 'lucide-react';

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
      setFeedbackSuccess('Thank you! Your feedback and rating have been recorded.');
      fetchReportDetails();
    } catch (err) {
      console.error('Feedback failed:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 font-semibold">Loading report timeline...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">Unable to view report</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'Report not found'}</p>
          <Link
            to={user?.role === 'department' ? '/department' : user?.role === 'admin' ? '/admin' : '/my-reports'}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Go Back
          </Link>
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Title */}
        <div className="flex items-center justify-between">
          <Link
            to={user?.role === 'department' ? '/department' : user?.role === 'admin' ? '/admin' : '/my-reports'}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-xs text-slate-400 font-mono">Report ID: #{report._id.slice(-8)}</span>
        </div>

        {/* Main Incident Overview Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${SEVERITY_COLORS[report.severity]}`}>
              Severity: {report.severity}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${STATUS_COLORS[report.status]}`}>
              Status: {report.status}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${DEPARTMENT_COLORS[report.department] || 'bg-slate-100'}`}>
              <Building2 className="w-3.5 h-3.5 inline mr-1" />
              {report.department} Department
            </span>

            {report.reportCount > 1 && (
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Crowd-Confirmed ({report.reportCount} Citizens)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            {report.title}
          </h1>

          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {report.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-4 h-4 text-slate-400" />
              Primary Reporter: {report.citizen?.name || 'Citizen'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-slate-400" />
              {new Date(report.createdAt).toLocaleString()}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-slate-400" />
              {report.location?.address} (Accuracy: ±{Math.round(report.accuracy || 10)}m)
            </span>
          </div>
        </div>

        {/* Evidence & Proof Comparison Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Initial Live Camera Photo */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                Watermarked Live Camera Photo
              </h3>
              <span className="text-[11px] text-slate-400">At Report Submission</span>
            </div>
            {report.imageUrl ? (
              <img
                src={report.imageUrl}
                alt="Citizen Evidence"
                className="w-full h-64 object-cover rounded-2xl border border-slate-200"
              />
            ) : (
              <div className="w-full h-64 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
                No initial image provided
              </div>
            )}
          </div>

          {/* Department Resolved Proof */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Department Proof of Resolution
              </h3>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {report.status === 'Resolved' ? 'Completed Work' : 'Pending Resolution'}
              </span>
            </div>
            {report.resolvedProofUrl ? (
              <img
                src={report.resolvedProofUrl}
                alt="Resolved Proof"
                className="w-full h-64 object-cover rounded-2xl border border-emerald-200"
              />
            ) : (
              <div className="w-full h-64 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <span>Field crew is actively responding to this incident.</span>
                <span className="text-[11px] text-slate-400 mt-1">Proof photo will be uploaded upon completion.</span>
              </div>
            )}
          </div>
        </div>

        {/* Crowd Confirmations Section (CHANGE 1 Extra Evidence) */}
        {report.confirmations && report.confirmations.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Additional Citizen Confirmations ({report.confirmations.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extra live photographic evidence and GPS fixes submitted by other citizens nearby.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {report.confirmations.map((conf, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <img
                    src={conf.imageUrl}
                    alt={`Confirmation ${idx + 1}`}
                    className="w-full h-36 object-cover rounded-xl border border-slate-200"
                  />
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-800">Confirmed by {conf.citizen?.name || 'Citizen'}</p>
                    <p className="text-slate-400">{new Date(conf.capturedAt).toLocaleString()}</p>
                    <p className="font-mono text-[10px] text-slate-500">
                      GPS: {conf.latitude?.toFixed(4)}, {conf.longitude?.toFixed(4)} (±{Math.round(conf.accuracy || 10)}m)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Field Notes & Location Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department Notes */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider text-xs">
              Department Field Notes
            </h3>
            {report.workNotes ? (
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
                "{report.workNotes}"
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No field notes logged yet.</p>
            )}

            {report.adminNotes && (
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Admin Triage Note:</span>
                <p className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 mt-1">
                  {report.adminNotes}
                </p>
              </div>
            )}
          </div>

          {/* Incident GPS Map */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider text-xs flex items-center justify-between">
              <span>Incident GPS Pin</span>
              <span className="font-mono text-slate-500 font-normal">
                {report.location?.latitude?.toFixed(4)}, {report.location?.longitude?.toFixed(4)}
              </span>
            </h3>
            <div className="h-44 rounded-2xl overflow-hidden border border-slate-200">
              <ReportMap reports={[report]} height="100%" zoom={14} />
            </div>
          </div>
        </div>

        {/* Visual Progress Timeline (statusHistory) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Lifecycle Progress Timeline</h3>
              <p className="text-xs text-slate-400">Step-by-step audit history from report to resolution</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {report.statusHistory?.length || 0} Milestone(s)
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {report.statusHistory && report.statusHistory.length > 0 ? (
              report.statusHistory.map((step, idx) => (
                <div key={idx} className="relative group">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 w-5 sm:w-6 h-5 sm:h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white ${
                      step.status === 'Resolved'
                        ? 'bg-emerald-500'
                        : step.status === 'In Progress'
                        ? 'bg-amber-500'
                        : step.status === 'Assigned'
                        ? 'bg-blue-500'
                        : 'bg-purple-500'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 group-hover:border-slate-300 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${STATUS_COLORS[step.status]}`}>
                          {step.status}
                        </span>
                        <span className="text-xs text-slate-500 capitalize font-medium">
                          by {step.role} {step.changedBy?.department ? `(${step.changedBy.department} Dept)` : ''}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(step.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {step.note && (
                      <p className="text-xs text-slate-700 mt-2 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                        {step.note}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No timeline entries available.</p>
            )}
          </div>
        </div>

        {/* Citizen Rating & Feedback Section (Shown if Resolved) */}
        {report.status === 'Resolved' && (
          <div className="bg-gradient-to-tr from-amber-50 via-white to-orange-50 p-6 sm:p-8 rounded-3xl border border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Citizen Resolution Feedback
                </h3>
                <p className="text-xs text-slate-500">Rate the speed and quality of work done by {report.department} Department.</p>
              </div>
            </div>

            {feedbackSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                {feedbackSuccess}
              </div>
            )}

            {canSubmitFeedback ? (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Your Rating (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className="p-1 focus:outline-none transition hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            num <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">{rating} Star{rating > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Feedback Comments
                  </label>
                  <textarea
                    rows={2}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Was the problem fully resolved? How was the response time?"
                    className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow transition flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
                </button>
              </form>
            ) : report.feedback?.rating ? (
              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  {[...Array(report.feedback.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-slate-700">{report.feedback.rating} / 5</span>
                </div>
                {report.feedback.comment && (
                  <p className="text-slate-600 italic mt-1">"{report.feedback.comment}"</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No rating has been submitted by the citizen yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetails;
