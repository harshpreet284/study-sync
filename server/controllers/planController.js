import mongoose from 'mongoose';
import { LearningPlan } from '../models/LearningPlan.js';
import { LearningGoal } from '../models/LearningGoal.js';
import { aiService } from '../services/aiService.js';

/**
 * Standard population fields for plan resources and goal details.
 */
const RESOURCE_SELECT_FIELDS =
  '_id title type difficulty estimatedDuration platform url category skills modules thumbnail';
const GOAL_SELECT_FIELDS =
  '_id title description targetSkills currentLevel weeklyHours targetDate status';

/**
 * @desc    Generate or regenerate a personalized AI study plan for a learning goal
 * @route   POST /api/plans/generate
 * @access  Private (Authenticated)
 */
export const generatePlan = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { goalId } = req.body;

    // 1. Validate goalId parameter
    if (!goalId || typeof goalId !== 'string' || !mongoose.Types.ObjectId.isValid(goalId.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid goal ID is required to generate a study plan.',
      });
    }

    // 2. Query goal strictly scoped to authenticated user ownership
    const goal = await LearningGoal.findOne({
      _id: goalId.trim(),
      user: userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Learning goal not found.',
      });
    }

    // 3. Generate and validate plan weeks via aiService
    const validatedWeeks = await aiService.generatePlanWeeks({
      user: req.user,
      goal,
    });

    // 4. Atomically persist/upsert plan to enforce 1 canonical plan per { user, goal }
    let plan;
    try {
      plan = await LearningPlan.findOneAndUpdate(
        { user: userId, goal: goal._id },
        {
          user: userId,
          goal: goal._id,
          generatedAt: new Date(),
          weeks: validatedWeeks,
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      )
        .populate({
          path: 'weeks.resources',
          select: RESOURCE_SELECT_FIELDS,
        })
        .populate({
          path: 'goal',
          select: GOAL_SELECT_FIELDS,
        });
    } catch (dbError) {
      // Race-condition safety: if concurrent requests hit duplicate key on compound index { user, goal }
      if (dbError.code === 11000) {
        plan = await LearningPlan.findOneAndUpdate(
          { user: userId, goal: goal._id },
          {
            generatedAt: new Date(),
            weeks: validatedWeeks,
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate({
            path: 'weeks.resources',
            select: RESOURCE_SELECT_FIELDS,
          })
          .populate({
            path: 'goal',
            select: GOAL_SELECT_FIELDS,
          });
      } else {
        throw dbError;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Learning plan generated successfully.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single study plan by plan ID (strictly owned by authenticated user)
 * @route   GET /api/plans/:id
 * @access  Private (Authenticated)
 */
export const getPlanById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format.',
      });
    }

    const plan = await LearningPlan.findOne({
      _id: id.trim(),
      user: userId,
    })
      .populate({
        path: 'weeks.resources',
        select: RESOURCE_SELECT_FIELDS,
      })
      .populate({
        path: 'goal',
        select: GOAL_SELECT_FIELDS,
      });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Learning plan not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get study plan associated with a specific learning goal
 * @route   GET /api/plans/goal/:goalId
 * @access  Private (Authenticated)
 */
export const getPlanByGoalId = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { goalId } = req.params;

    if (!goalId || !mongoose.Types.ObjectId.isValid(goalId.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format.',
      });
    }

    // Verify goal exists and belongs to authenticated user
    const goal = await LearningGoal.findOne({
      _id: goalId.trim(),
      user: userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Learning goal not found.',
      });
    }

    // Fetch plan if generated
    const plan = await LearningPlan.findOne({
      goal: goalId.trim(),
      user: userId,
    })
      .populate({
        path: 'weeks.resources',
        select: RESOURCE_SELECT_FIELDS,
      })
      .populate({
        path: 'goal',
        select: GOAL_SELECT_FIELDS,
      });

    if (!plan) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No study plan has been generated for this goal yet.',
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};
