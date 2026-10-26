// server/middleware/auth.js
// Authentication middleware for verifying JSON Web Tokens (JWT)

const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate requests via JWT.
 * Expects header: "Authorization: Bearer <token>"
 * Attaches decoded user info: req.user = { id: decoded.userId }
 */
const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    // Check if Authorization header is present and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No authentication token provided, authorization denied',
      });
    }

    // Extract the token after 'Bearer '
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({
        message: 'Token is missing, authorization denied',
      });
    }

    // Verify token using secret
    const secret = process.env.JWT_SECRET || 'tripmate_dev_secret_change_in_production';
    const decoded = jwt.verify(token, secret);

    // Attach user payload to request
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token is not valid or has expired',
      error: error.message,
    });
  }
};

module.exports = auth;
