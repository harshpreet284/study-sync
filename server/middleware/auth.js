import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Authentication middleware that verifies JWT bearer tokens.
 *
 * Ensures:
 * - A valid Bearer token exists in the Authorization header.
 * - The token was signed with the configured JWT_SECRET and is unexpired.
 * - The associated user still exists in the database.
 * - Sets req.user (excluding passwordHash) for downstream controllers.
 * - Identity is never derived from client-supplied request bodies or query params.
 */
export const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Auth Error] JWT_SECRET is not configured on the server.');
      return res.status(500).json({
        success: false,
        message: 'An unexpected internal server error occurred.',
      });
    }

    const decoded = jwt.verify(token, secret);

    // Fetch user without passwordHash
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account associated with this token no longer exists.',
      });
    }

    // Attach verified user document to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    console.error('[Auth Middleware Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An unexpected internal server error occurred.',
    });
  }
};
