import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All dashboard endpoints require authentication
router.use(protect);

router.get('/', getDashboard);

export default router;
