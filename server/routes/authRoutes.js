import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * Rate limiter applied to public authentication endpoints (register, login)
 * to prevent brute-force attacks and credential stuffing.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 30, // 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', protect, getMe);

export default router;
