// server/src/routes/reportRoutes.js
// Routes for emergency reporting, department workflows, admin triage, and citizen timelines.

const express = require('express');
const router = express.Router();
const {
  createReport,
  checkDuplicate,
  getMyReports,
  getDepartmentReports,
  getAllReports,
  getReportById,
  updateDepartmentStatus,
  adminReassignReport,
  submitFeedback,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { roleCheck } = require('../middleware/roleCheck');
const upload = require('../middleware/uploadMiddleware');

// Citizen report submission & personal history
router.post('/', protect, roleCheck('citizen'), upload.single('image'), createReport);
router.get('/check-duplicate', protect, checkDuplicate);
router.get('/my', protect, roleCheck('citizen'), getMyReports);

// Department-isolated reports and status workflow
router.get('/department', protect, roleCheck('department'), getDepartmentReports);
router.patch(
  '/:id/department-status',
  protect,
  roleCheck('department'),
  upload.single('resolvedProof'),
  updateDepartmentStatus
);

// Admin master list & routing override
router.get('/', protect, roleCheck('admin'), getAllReports);
router.patch('/:id/admin-reassign', protect, roleCheck('admin'), adminReassignReport);

// Shared report detail view (isolated by controller based on role)
router.get('/:id', protect, getReportById);

// Citizen feedback submission after resolution
router.post('/:id/feedback', protect, roleCheck('citizen'), submitFeedback);

module.exports = router;
