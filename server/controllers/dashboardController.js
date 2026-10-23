import { dashboardService } from '../services/dashboardService.js';

/**
 * @desc    Get consolidated dashboard metrics and next-step recommendation
 * @route   GET /api/dashboard
 * @access  Private (Authenticated)
 */
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const data = await dashboardService.getDashboardData(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
