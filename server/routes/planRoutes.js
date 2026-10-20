import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  generatePlan,
  getPlanById,
  getPlanByGoalId,
} from '../controllers/planController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * Rate limiter applied strictly to plan generation requests.
 * Allows up to 5 generations per 15-minute window per authenticated user.
 */
export const planGenerationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    // Authenticated user ID (since protect middleware executes prior to this limiter)
    return req.user?._id?.toString() || 'anonymous';
  },
  validate: {
    keyGeneratorIpFallback: false,
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Plan generation rate limit reached. You can generate up to 5 study plans per 15 minutes. Please try again later.',
    });
  },
});

// All learning plan routes require authentication
router.use(protect);

// Plan generation (rate-limited per authenticated user)
router.post('/generate', planGenerationRateLimiter, generatePlan);

// Plan retrieval by Goal ID (static subpath before parameterized :id)
router.get('/goal/:goalId', getPlanByGoalId);

// Single plan retrieval by Plan ID
router.get('/:id', getPlanById);

export default router;
