import mongoose from 'mongoose';
import { LearningGoal } from '../models/LearningGoal.js';

const VALID_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const VALID_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED'];

/**
 * Deduplicate skill strings case-insensitively while preserving original order and first-encountered casing.
 * @param {string[]} skills
 * @returns {string[]}
 */
const deduplicateSkills = (skills) => {
  const seen = new Set();
  const result = [];
  for (const raw of skills) {
    const trimmed = raw.trim();
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }
  return result;
};

/**
 * Validates and parses targetDate strictly against ISO 8601 calendar format.
 * Rejects non-string primitives (booleans, numbers, objects, arrays), empty/whitespace strings,
 * and impossible calendar dates (e.g. 2026-02-31).
 *
 * @param {*} val
 * @returns {{ valid: boolean, date?: Date | null, message?: string }}
 */
const parseStrictTargetDate = (val) => {
  if (val === null) {
    return { valid: true, date: null };
  }
  if (typeof val !== 'string') {
    return { valid: false, message: 'Target date must be a valid ISO date string or null.' };
  }
  const trimmed = val.trim();
  if (trimmed === '') {
    return { valid: false, message: 'Target date cannot be an empty string.' };
  }

  // Match ISO 8601 date-only (YYYY-MM-DD) or date-time (YYYY-MM-DDTHH:mm:ss...)
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(?:Z|([+-]\d{2}:?\d{2}))?)?$/;
  const match = trimmed.match(isoRegex);
  if (!match) {
    return { valid: false, message: 'Invalid targetDate format. Must be a valid ISO date string (YYYY-MM-DD or full ISO 8601).' };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    return { valid: false, message: 'Invalid targetDate month. Month must be between 1 and 12.' };
  }

  // Calculate actual days in given year/month to prevent calendar date roll-over
  const maxDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > maxDays) {
    return { valid: false, message: `Invalid targetDate calendar date. Day ${day} does not exist in month ${month}/${year}.` };
  }

  const d = new Date(trimmed);
  if (isNaN(d.getTime())) {
    return { valid: false, message: 'Invalid targetDate format. Must be a valid date.' };
  }

  return { valid: true, date: d };
};

/**
 * @desc    Create a new learning goal for the authenticated user
 * @route   POST /api/goals
 * @access  Private (Authenticated)
 */
export const createGoal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      title,
      description,
      targetSkills,
      currentLevel,
      weeklyHours,
      targetDate,
      status,
    } = req.body;

    // 1. Validate required title
    if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Goal title is required.',
      });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Goal title cannot exceed 200 characters.',
      });
    }

    // 2. Validate description if supplied
    let trimmedDescription = '';
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Description must be a string.',
        });
      }
      trimmedDescription = description.trim();
      if (trimmedDescription.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 2000 characters.',
        });
      }
    }

    // 3. Validate targetSkills if supplied (trim & deduplicate)
    let cleanSkills = [];
    if (targetSkills !== undefined && targetSkills !== null) {
      if (!Array.isArray(targetSkills)) {
        return res.status(400).json({
          success: false,
          message: 'Target skills must be an array of strings.',
        });
      }
      for (const skill of targetSkills) {
        if (typeof skill !== 'string' || skill.trim() === '') {
          return res.status(400).json({
            success: false,
            message: 'Each target skill must be a non-empty string.',
          });
        }
      }
      cleanSkills = deduplicateSkills(targetSkills);
    }

    // 4. Validate currentLevel if supplied
    let normalizedLevel = 'BEGINNER';
    if (currentLevel !== undefined) {
      if (currentLevel === null || typeof currentLevel !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Current level must be a non-null string.',
        });
      }
      normalizedLevel = currentLevel.trim().toUpperCase();
      if (!VALID_LEVELS.includes(normalizedLevel)) {
        return res.status(400).json({
          success: false,
          message: `Invalid currentLevel: '${currentLevel}'. Allowed values: ${VALID_LEVELS.join(', ')}`,
        });
      }
    }

    // 5. Validate weeklyHours if supplied
    let parsedWeeklyHours = 5;
    if (weeklyHours !== undefined && weeklyHours !== null) {
      if (typeof weeklyHours !== 'number' || !Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 168) {
        return res.status(400).json({
          success: false,
          message: 'Weekly study hours must be a number between 1 and 168.',
        });
      }
      parsedWeeklyHours = weeklyHours;
    }

    // 6. Validate targetDate if supplied (strict calendar validation)
    let parsedTargetDate = null;
    if (targetDate !== undefined) {
      const parsed = parseStrictTargetDate(targetDate);
      if (!parsed.valid) {
        return res.status(400).json({
          success: false,
          message: parsed.message,
        });
      }
      parsedTargetDate = parsed.date;
    }

    // 7. Validate status if supplied
    let normalizedStatus = 'ACTIVE';
    if (status !== undefined) {
      if (status === null || typeof status !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Status must be a non-null string.',
        });
      }
      normalizedStatus = status.trim().toUpperCase();
      if (!VALID_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status: '${status}'. Allowed values: ${VALID_STATUSES.join(', ')}`,
        });
      }
    }

    // 8. Create goal strictly derived from authenticated req.user
    const goal = await LearningGoal.create({
      user: userId,
      title: trimmedTitle,
      description: trimmedDescription,
      targetSkills: cleanSkills,
      currentLevel: normalizedLevel,
      weeklyHours: parsedWeeklyHours,
      targetDate: parsedTargetDate,
      status: normalizedStatus,
    });

    return res.status(201).json({
      success: true,
      message: 'Learning goal created successfully.',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all learning goals for the authenticated user
 * @route   GET /api/goals
 * @access  Private (Authenticated)
 */
export const getGoals = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const filter = { user: userId };

    // Optional status filter
    if (req.query.status) {
      const normalizedStatus = String(req.query.status).trim().toUpperCase();
      if (!VALID_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter: '${req.query.status}'. Allowed values: ${VALID_STATUSES.join(', ')}`,
        });
      }
      filter.status = normalizedStatus;
    }

    const goals = await LearningGoal.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single learning goal by ID (strictly owned by authenticated user)
 * @route   GET /api/goals/:id
 * @access  Private (Authenticated)
 */
export const getGoalById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format.',
      });
    }

    const goal = await LearningGoal.findOne({
      _id: id.trim(),
      user: userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Learning goal not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a learning goal (strictly owned by authenticated user)
 * @route   PATCH /api/goals/:id
 * @access  Private (Authenticated)
 */
export const updateGoal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // 1. Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format.',
      });
    }

    // 2. Validate request body presence
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update.',
      });
    }

    const allowedFields = [
      'title',
      'description',
      'targetSkills',
      'currentLevel',
      'weeklyHours',
      'targetDate',
      'status',
    ];

    const providedFields = Object.keys(req.body).filter((key) => allowedFields.includes(key));

    if (providedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid editable fields provided.',
      });
    }

    const {
      title,
      description,
      targetSkills,
      currentLevel,
      weeklyHours,
      targetDate,
      status,
    } = req.body;

    // 3. Field-specific validations
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Goal title cannot be empty.',
        });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Goal title cannot exceed 200 characters.',
        });
      }
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Description must be a string.',
        });
      }
      if (description.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 2000 characters.',
        });
      }
    }

    let cleanSkills;
    if (targetSkills !== undefined) {
      if (targetSkills === null) {
        cleanSkills = [];
      } else if (!Array.isArray(targetSkills)) {
        return res.status(400).json({
          success: false,
          message: 'Target skills must be an array of strings.',
        });
      } else {
        for (const skill of targetSkills) {
          if (typeof skill !== 'string' || skill.trim() === '') {
            return res.status(400).json({
              success: false,
              message: 'Each target skill must be a non-empty string.',
            });
          }
        }
        cleanSkills = deduplicateSkills(targetSkills);
      }
    }

    let normalizedLevel;
    if (currentLevel !== undefined) {
      if (currentLevel === null || typeof currentLevel !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Current level must be a non-null string.',
        });
      }
      normalizedLevel = currentLevel.trim().toUpperCase();
      if (!VALID_LEVELS.includes(normalizedLevel)) {
        return res.status(400).json({
          success: false,
          message: `Invalid currentLevel: '${currentLevel}'. Allowed values: ${VALID_LEVELS.join(', ')}`,
        });
      }
    }

    if (weeklyHours !== undefined) {
      if (typeof weeklyHours !== 'number' || !Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 168) {
        return res.status(400).json({
          success: false,
          message: 'Weekly study hours must be a number between 1 and 168.',
        });
      }
    }

    let parsedTargetDate;
    if (targetDate !== undefined) {
      const parsed = parseStrictTargetDate(targetDate);
      if (!parsed.valid) {
        return res.status(400).json({
          success: false,
          message: parsed.message,
        });
      }
      parsedTargetDate = parsed.date;
    }

    let normalizedStatus;
    if (status !== undefined) {
      if (status === null || typeof status !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Status must be a non-null string.',
        });
      }
      normalizedStatus = status.trim().toUpperCase();
      if (!VALID_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status: '${status}'. Allowed values: ${VALID_STATUSES.join(', ')}`,
        });
      }
    }

    // 4. Query record strictly scoped by ID and user ownership
    const goal = await LearningGoal.findOne({
      _id: id.trim(),
      user: userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Learning goal not found.',
      });
    }

    // 5. Apply permitted updates
    if (title !== undefined) goal.title = title.trim();
    if (description !== undefined) goal.description = description !== null ? description.trim() : '';
    if (cleanSkills !== undefined) goal.targetSkills = cleanSkills;
    if (normalizedLevel !== undefined) goal.currentLevel = normalizedLevel;
    if (weeklyHours !== undefined) goal.weeklyHours = weeklyHours;
    if (targetDate !== undefined) goal.targetDate = parsedTargetDate;
    if (normalizedStatus !== undefined) goal.status = normalizedStatus;

    await goal.save();

    return res.status(200).json({
      success: true,
      message: 'Learning goal updated successfully.',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a learning goal (strictly owned by authenticated user)
 * @route   DELETE /api/goals/:id
 * @access  Private (Authenticated)
 */
export const deleteGoal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format.',
      });
    }

    const goal = await LearningGoal.findOneAndDelete({
      _id: id.trim(),
      user: userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Learning goal not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Learning goal deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
