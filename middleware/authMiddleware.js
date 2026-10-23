const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware:
 * Validates the JWT Bearer token, fetches the user from the database,
 * checks if the user is active, and attaches req.user.
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no authentication token provided'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'ticking_luxury_watches_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token payload'
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found with this token'
      });
    }

    if (user.isActive === false || user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact TICKING concierge for assistance.'
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        expired: true,
        message: 'Session expired, please log in again'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token verification failed'
    });
  }
};

/**
 * Admin middleware:
 * Requires protect to have run first. Verifies the user has admin role.
 */
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, authentication required'
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Master administrator privileges required'
  });
};

/**
 * Optional authentication middleware:
 * If a token is provided and valid, attaches req.user, but does not block requests if not.
 */
const optionalAuth = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'ticking_luxury_watches_super_secret_jwt_key_2026';
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive !== false && !user.deletedAt) {
          req.user = user;
        }
      }
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};

module.exports = { protect, admin, optionalAuth };
