// server/src/middleware/authMiddleware.js
// Verifies JWT token and attaches the authenticated user to req.user

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if Bearer token is provided in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by decoded ID, excluding password field
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found or account deactivated' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[Auth Middleware Error]:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization denied: No token provided' });
  }
};

module.exports = { protect };
