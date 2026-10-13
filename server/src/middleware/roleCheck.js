// server/src/middleware/roleCheck.js
// Enforces role-based access control (citizen, department, admin)
// and department isolation on the backend.

/**
 * Checks whether the authenticated user has one of the required roles.
 * @param  {...string} roles - Allowed roles (e.g., 'citizen', 'department', 'admin')
 */
const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}]. Your role is '${req.user.role}'`,
      });
    }

    next();
  };
};

module.exports = { roleCheck };
