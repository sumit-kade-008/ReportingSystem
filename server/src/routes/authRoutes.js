// server/src/routes/authRoutes.js
// Routes for citizen registration, login, profile check, and department account administration.

const express = require('express');
const router = express.Router();
const {
  registerCitizen,
  loginUser,
  getMe,
  createDepartmentUser,
  listDepartmentUsers,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { roleCheck } = require('../middleware/roleCheck');

// Public routes
router.post('/register', registerCitizen);
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getMe);

// Admin-only management routes
router.post('/create-department', protect, roleCheck('admin'), createDepartmentUser);
router.get('/departments', protect, roleCheck('admin'), listDepartmentUsers);

module.exports = router;
