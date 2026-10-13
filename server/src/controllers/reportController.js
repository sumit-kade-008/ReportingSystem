// server/src/controllers/reportController.js
// Handles report creation with auto-assignment & duplicate detection,
// department-isolated workflows, admin triage/overrides, and citizen timelines.

const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { getAutoAssignment } = require('../../config/departmentMap');
const { calculateDistanceInMeters } = require('../utils/geoUtils');

/**
 * @desc    Submit an Emergency Report (Citizen)
 * @route   POST /api/reports
 * @access  Protected (Citizen)
 */
const createReport = async (req, res, next) => {
  try {
    const { title, description, category, severity, latitude, longitude, address, forceSubmit } = req.body;

    // Validate essential fields
    if (!title || !description || !category || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, latitude, and longitude',
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an evidence photograph' });
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    // Duplicate Detection: Check for active reports of the same category within 50 meters
    if (forceSubmit !== 'true' && forceSubmit !== true) {
      const activeNearbyReports = await Report.find({
        category,
        status: { $in: ['Pending', 'Assigned', 'In Progress'] },
      });

      const duplicate = activeNearbyReports.find((r) => {
        const dist = calculateDistanceInMeters(latNum, lonNum, r.location.latitude, r.location.longitude);
        return dist <= 50; // Within 50 meters
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          duplicateFound: true,
          message: `A similar active emergency report was already logged within 50 meters (${duplicate.title}).`,
          existingReport: {
            id: duplicate._id,
            title: duplicate.title,
            status: duplicate.status,
            createdAt: duplicate.createdAt,
          },
        });
      }
    }

    // Auto-assignment routing based on category config
    const { department, status } = getAutoAssignment(category);

    const initialNote =
      department !== 'Unassigned'
        ? `Report automatically routed to ${department} Department based on category '${category}'.`
        : `Category '${category}' unmapped. Routed to Admin triage queue.`;

    const imageUrl = `/uploads/${req.file.filename}`;

    const report = await Report.create({
      title,
      description,
      category,
      severity: severity || 'Medium',
      location: {
        latitude: latNum,
        longitude: lonNum,
        address: address || 'GPS Pin Location',
        coordinates: [lonNum, latNum],
      },
      imageUrl,
      status,
      department,
      citizen: req.user._id,
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

    // Create initial notification for the citizen
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
    }).select('title category severity location status createdAt');

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
 * @desc    Get all reports submitted by the logged-in Citizen
 * @route   GET /api/reports/my
 * @access  Protected (Citizen)
 */
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ citizen: req.user._id }).sort({ createdAt: -1 });
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

    // STRICT BACKEND ISOLATION: Force department to match logged in department officer
    const query = { department: departmentName };

    // Optional query filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.severity) {
      query.severity = req.query.severity;
    }

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

    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.severity) {
      query.severity = req.query.severity;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

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
      .populate('statusHistory.changedBy', 'name role department');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // BACKEND ENFORCEMENT: If caller is department user, ensure it belongs to their department
    if (req.user.role === 'department' && report.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Report is assigned to ${report.department}, not your department (${req.user.department})`,
      });
    }

    // If caller is citizen, ensure it is their own report
    if (req.user.role === 'citizen' && report.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view your own submitted reports',
      });
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

    // If resolved proof image was uploaded
    if (req.file) {
      report.resolvedProofUrl = `/uploads/${req.file.filename}`;
    }

    // If resolving, record resolution timestamp for performance calculations
    if (status === 'Resolved') {
      report.resolvedAt = new Date();
    }

    // Record milestone in statusHistory audit timeline
    report.statusHistory.push({
      status,
      changedBy: req.user._id,
      role: 'department',
      note: workNotes || `Status updated to ${status} by ${req.user.department} Department`,
      timestamp: new Date(),
    });

    await report.save();

    // Trigger Notification for the citizen
    await Notification.create({
      recipient: report.citizen,
      report: report._id,
      title: `Status Update: ${status}`,
      message: `Your report '${report.title}' has been moved to '${status}' by the ${req.user.department} Department.${
        workNotes ? ` Note: "${workNotes}"` : ''
      }`,
    });

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
    const previousStatus = report.status;

    if (department) {
      report.department = department;
      // If report was Pending and now assigned, move status to Assigned unless explicitly set
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

    // Notify citizen
    await Notification.create({
      recipient: report.citizen,
      report: report._id,
      title: 'Report Reassigned / Updated by Admin',
      message: `Your emergency report '${report.title}' is now handled by ${report.department} Department (Status: ${report.status}).`,
    });

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

    if (report.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only rate your own reports' });
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
