// server/src/routes/statsRoutes.js
// Routes for Department KPI counts and Admin analytical charts.

const express = require('express');
const router = express.Router();
const {
  getDepartmentStats,
  getAdminOverviewStats,
  getDepartmentPerformanceStats,
} = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');
const { roleCheck } = require('../middleware/roleCheck');

// Department KPI counters
router.get('/department', protect, roleCheck('department'), getDepartmentStats);

// Admin-only metrics and charts
router.get('/admin-overview', protect, roleCheck('admin'), getAdminOverviewStats);
router.get('/department-performance', protect, roleCheck('admin'), getDepartmentPerformanceStats);

module.exports = router;
