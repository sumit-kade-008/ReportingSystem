// server/src/controllers/reportController.js
// Handles emergency report submission with anti-fraud validations (camera timestamp & GPS accuracy),
// collaborative duplicate confirmation (no duplicate reports allowed), multi-citizen notifications,
// department workflows, and admin overrides.

const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { getAutoAssignment } = require('../../config/departmentMap');
const { calculateDistanceInMeters } = require('../utils/geoUtils');

/**
 * @desc    Submit an Emergency Report (Citizen with Live Camera + High Accuracy GPS)
 * @route   POST /api/reports
 * @access  Protected (Citizen)
 */
const createReport = async (req, res, next) => {
  try {
    const { title, description, category, severity, latitude, longitude, address, accuracy, capturedAt } = req.body;

    // 1. Basic field checks
    if (!title || !description || !category || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, latitude, and longitude',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'A live camera photograph is required for verification',
      });
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    const accNum = parseFloat(accuracy);

    // 2. Anti-fraud Check: GPS Accuracy must be 100 meters or better
    if (isNaN(accNum) || accNum > 100) {
      return res.status(400).json({
        success: false,
        message: `GPS accuracy is too low (±${Math.round(accNum || 0)}m). Must be within 100 meters to prevent fraudulent coordinates. Please move to an open area and retry.`,
      });
    }

    // 3. Anti-fraud Check: Camera Capture Timestamp (must be within 2 minutes of server time)
    if (!capturedAt) {
      return res.status(400).json({
        success: false,
        message: 'Camera capture timestamp (capturedAt) is required for verification',
      });
    }

    const captureDate = new Date(capturedAt);
    if (isNaN(captureDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid capturedAt timestamp' });
    }

    const timeDiffMs = Math.abs(Date.now() - captureDate.getTime());
    if (timeDiffMs > 2 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Photo capture timestamp has expired (> 2 minutes old). Photos must be taken live through the in-app camera.',
      });
    }

    const uploadedImageUrl = `/uploads/${req.file.filename}`;

    // 4. Collaborative Duplicate Detection: Check for active reports of the same category within 50 meters
    const activeNearbyReports = await Report.find({
      category,
      status: { $in: ['Pending', 'Assigned', 'In Progress'] },
    }).populate('citizen', 'name email');

    const duplicate = activeNearbyReports.find((r) => {
      const dist = calculateDistanceInMeters(latNum, lonNum, r.location.latitude, r.location.longitude);
      return dist <= 50; // Within 50 meters
    });

    if (duplicate) {
      const userIdStr = req.user._id.toString();
      const isOriginalReporter = duplicate.citizen._id.toString() === userIdStr;
      const alreadyConfirmed = duplicate.reportedBy.some((id) => id.toString() === userIdStr);

      // If this citizen has already reported or confirmed this incident:
      if (isOriginalReporter || alreadyConfirmed) {
        return res.status(409).json({
          success: false,
          duplicate: true,
          alreadyReported: true,
          message: 'You have already reported this emergency',
          report: duplicate,
        });
      }

      // Add this new citizen to the existing live emergency as extra confirmation
      duplicate.confirmations.push({
        citizen: req.user._id,
        imageUrl: uploadedImageUrl,
        latitude: latNum,
        longitude: lonNum,
        accuracy: accNum,
        capturedAt: captureDate,
      });

      duplicate.reportedBy.push(req.user._id);
      duplicate.reportCount = (duplicate.reportCount || 1) + 1;
      await duplicate.save();

      // Create notification for this newly linked citizen
      await Notification.create({
        recipient: req.user._id,
        report: duplicate._id,
        title: 'Emergency Linked: Incident Already Live',
        message: `Your live photo and location confirmed emergency #${duplicate._id.toString().slice(-6)} (${duplicate.title}). You will receive live status updates.`,
      });

      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'This emergency is already live. Your live photo and GPS confirmation have been linked.',
        report: duplicate,
      });
    }

    // 5. Anti-fraud Deterministic Routing: Server decides department and status from category map (client params ignored)
    const { department, status } = getAutoAssignment(category);

    const initialNote =
      department !== 'Unassigned'
        ? `Report automatically routed to ${department} Department based on category '${category}'.`
        : `Category '${category}' unmapped. Routed to Admin triage queue.`;

    const report = await Report.create({
      title,
      description,
      category,
      severity: severity || 'Medium',
      location: {
        latitude: latNum,
        longitude: lonNum,
        address: address || 'GPS Detected Location',
        coordinates: [lonNum, latNum],
      },
      accuracy: accNum,
      capturedAt: captureDate,
      imageUrl: uploadedImageUrl,
      status,
      department,
      citizen: req.user._id,
      reportedBy: [req.user._id],
      reportCount: 1,
      confirmations: [],
      statusHistory: [
        {
          status,
          changedBy: req.user._id,
          role: 'citizen',
          note: initialNote,
          timestamp: new Date(),
        },
      ],
    });

    // Create initial notification for the submitter
    await Notification.create({
      recipient: req.user._id,
      report: report._id,
      title: 'Report Submitted Successfully',
      message:
        status === 'Assigned'
          ? `Your report #${report._id.toString().slice(-6)} has been routed to the ${department} Department.`
          : `Your report #${report._id.toString().slice(-6)} is pending Admin triage.`,
    });

    res.status(201).json({
      success: true,
      duplicate: false,
      message: 'Report submitted successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check for potential duplicate emergencies nearby before submission
 * @route   GET /api/reports/check-duplicate
 * @access  Protected
 */
const checkDuplicate = async (req, res, next) => {
  try {
    const { category, latitude, longitude } = req.query;

    if (!category || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Missing category, latitude, or longitude' });
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    const activeReports = await Report.find({
      category,
      status: { $in: ['Pending', 'Assigned', 'In Progress'] },
    }).select('title category severity location status reportCount imageUrl createdAt');

    const duplicates = activeReports
      .map((r) => {
        const dist = calculateDistanceInMeters(latNum, lonNum, r.location.latitude, r.location.longitude);
        return { ...r.toObject(), distanceMeters: dist };
      })
      .filter((r) => r.distanceMeters <= 50);

    res.status(200).json({
      success: true,
      duplicateFound: duplicates.length > 0,
      count: duplicates.length,
      duplicates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reports submitted or confirmed by the logged-in Citizen
 * @route   GET /api/reports/my
 * @access  Protected (Citizen)
 */
const getMyReports = async (req, res, next) => {
  try {
    // Return reports where the user is either the original citizen OR in reportedBy
    const reports = await Report.find({
      $or: [{ citizen: req.user._id }, { reportedBy: req.user._id }],
    })
      .populate('citizen', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reports.length, reports });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reports assigned to the logged-in Department
 * @route   GET /api/reports/department
 * @access  Protected (Department)
 */
const getDepartmentReports = async (req, res, next) => {
  try {
    const departmentName = req.user.department;

    if (!departmentName) {
      return res.status(403).json({ success: false, message: 'Department user has no assigned department' });
    }

    // STRICT BACKEND ISOLATION: Force department to match logged-in officer
    const query = { department: departmentName };

    if (req.query.status) query.status = req.query.status;
    if (req.query.severity) query.severity = req.query.severity;

    const reports = await Report.find(query)
      .populate('citizen', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      department: departmentName,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reports across the system (Admin only)
 * @route   GET /api/reports
 * @access  Protected (Admin)
 */
const getAllReports = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.department) query.department = req.query.department;
    if (req.query.status) query.status = req.query.status;
    if (req.query.severity) query.severity = req.query.severity;
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) query.title = { $regex: req.query.search, $options: 'i' };

    const reports = await Report.find(query)
      .populate('citizen', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reports.length, reports });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get details of a single report
 * @route   GET /api/reports/:id
 * @access  Protected
 */
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('reportedBy', 'name email')
      .populate('confirmations.citizen', 'name email')
      .populate('statusHistory.changedBy', 'name role department');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // BACKEND ENFORCEMENT: Department user can only access reports assigned to their department
    if (req.user.role === 'department' && report.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Report is assigned to ${report.department}, not your department (${req.user.department})`,
      });
    }

    // BACKEND ENFORCEMENT: Citizen can access if they are original author OR in reportedBy
    if (req.user.role === 'citizen') {
      const userIdStr = req.user._id.toString();
      const isOriginal = report.citizen._id.toString() === userIdStr;
      const isConfirming = report.reportedBy.some((u) => (u._id || u).toString() === userIdStr);

      if (!isOriginal && !isConfirming) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view reports you reported or confirmed',
        });
      }
    }

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Department Officer updates report status (Assigned -> In Progress -> Resolved)
 * @route   PATCH /api/reports/:id/department-status
 * @access  Protected (Department)
 */
const updateDepartmentStatus = async (req, res, next) => {
  try {
    const { status, workNotes } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // STRICT BACKEND ENFORCEMENT
    if (report.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This report belongs to ${report.department}, not ${req.user.department}`,
      });
    }

    const allowedTransitions = ['In Progress', 'Resolved'];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Department status can only transition to 'In Progress' or 'Resolved'",
      });
    }

    report.status = status;
    if (workNotes) {
      report.workNotes = workNotes;
    }

    if (req.file) {
      report.resolvedProofUrl = `/uploads/${req.file.filename}`;
    }

    if (status === 'Resolved') {
      report.resolvedAt = new Date();
    }

    // Record milestone in audit timeline
    report.statusHistory.push({
      status,
      changedBy: req.user._id,
      role: 'department',
      note: workNotes || `Status updated to ${status} by ${req.user.department} Department`,
      timestamp: new Date(),
    });

    await report.save();

    // Trigger Notifications for ALL linked citizens (primary submitter + all confirming citizens)
    const allCitizens = new Set([
      report.citizen.toString(),
      ...(report.reportedBy || []).map((id) => id.toString()),
    ]);

    for (const citizenId of allCitizens) {
      await Notification.create({
        recipient: citizenId,
        report: report._id,
        title: `Status Update: ${status}`,
        message: `Emergency '${report.title}' has been moved to '${status}' by the ${req.user.department} Department.${
          workNotes ? ` Note: "${workNotes}"` : ''
        }`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Report status updated to ${status}`,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin reassigns department or updates status (Admin override)
 * @route   PATCH /api/reports/:id/admin-reassign
 * @access  Protected (Admin)
 */
const adminReassignReport = async (req, res, next) => {
  try {
    const { department, status, adminNotes } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const previousDept = report.department;

    if (department) {
      report.department = department;
      if (report.status === 'Pending' && department !== 'Unassigned') {
        report.status = 'Assigned';
      }
    }

    if (status) {
      report.status = status;
      if (status === 'Resolved' && !report.resolvedAt) {
        report.resolvedAt = new Date();
      }
    }

    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes;
    }

    const auditNote =
      department && department !== previousDept
        ? `Admin reassigned report from ${previousDept} to ${department}. ${adminNotes || ''}`
        : `Admin updated status to ${report.status}. ${adminNotes || ''}`;

    report.statusHistory.push({
      status: report.status,
      changedBy: req.user._id,
      role: 'admin',
      note: auditNote.trim(),
      timestamp: new Date(),
    });

    await report.save();

    // Notify ALL linked citizens
    const allCitizens = new Set([
      report.citizen.toString(),
      ...(report.reportedBy || []).map((id) => id.toString()),
    ]);

    for (const citizenId of allCitizens) {
      await Notification.create({
        recipient: citizenId,
        report: report._id,
        title: 'Report Reassigned / Updated by Admin',
        message: `Your emergency report '${report.title}' is now handled by ${report.department} Department (Status: ${report.status}).`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report updated and reassigned successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit citizen rating & review after resolution
 * @route   POST /api/reports/:id/feedback
 * @access  Protected (Citizen)
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const userIdStr = req.user._id.toString();
    const isOriginal = report.citizen.toString() === userIdStr;
    const isLinked = (report.reportedBy || []).some((id) => id.toString() === userIdStr);

    if (!isOriginal && !isLinked) {
      return res.status(403).json({ success: false, message: 'You can only rate reports you reported or confirmed' });
    }

    if (report.status !== 'Resolved') {
      return res.status(400).json({ success: false, message: 'Feedback can only be submitted after resolution' });
    }

    report.feedback = {
      rating: Number(rating),
      comment: comment || '',
      submittedAt: new Date(),
    };

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      feedback: report.feedback,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  checkDuplicate,
  getMyReports,
  getDepartmentReports,
  getAllReports,
  getReportById,
  updateDepartmentStatus,
  adminReassignReport,
  submitFeedback,
};
