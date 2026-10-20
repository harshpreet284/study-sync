import mongoose from 'mongoose';
import { LearningProgress } from '../models/LearningProgress.js';
import { Resource } from '../models/Resource.js';

const VALID_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

/**
 * @desc    Get all learning records for the authenticated user
 * @route   GET /api/learning
 * @access  Private (Authenticated)
 */
export const getLearningRecords = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const records = await LearningProgress.find({ user: userId })
      .populate('resource')
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a resource to the authenticated user's learning library
 * @route   POST /api/learning
 * @access  Private (Authenticated)
 */
export const addLearningRecord = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { resourceId } = req.body;

    // 1. Validate resourceId presence
    if (resourceId === undefined || resourceId === null || resourceId === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid resourceId.',
      });
    }

    const trimmedId = String(resourceId).trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(trimmedId);
    const isNumericId = /^\d+$/.test(trimmedId);

    if (!isObjectId && !isNumericId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID format. Must be a valid ObjectId or numeric ID.',
      });
    }

    // 2. Verify referenced resource exists in catalog
    let resource;
    if (isObjectId) {
      resource = await Resource.findById(trimmedId);
    } else {
      resource = await Resource.findOne({ sourceId: Number(trimmedId) });
    }

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    // 3. Check for existing record to prevent duplicates
    const existingRecord = await LearningProgress.findOne({
      user: userId,
      resource: resource._id,
    });

    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'This resource is already in your learning library.',
      });
    }

    // 4. Create new learning record (strictly derived from authenticated req.user)
    const newRecord = await LearningProgress.create({
      user: userId,
      resource: resource._id,
      status: 'NOT_STARTED',
      progress: 0,
      startedAt: null,
      completedAt: null,
    });

    // Populate resource for client response
    await newRecord.populate('resource');

    return res.status(201).json({
      success: true,
      data: newRecord,
    });
  } catch (error) {
    // Handle concurrent duplicate key race condition (E11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This resource is already in your learning library.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Update progress and/or status of a user's learning record
 * @route   PATCH /api/learning/:id
 * @access  Private (Authenticated)
 */
export const updateLearningRecord = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // 1. Validate ID format
    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid learning record ID format.',
      });
    }

    const { progress, status } = req.body;

    // 2. Reject empty update payloads
    if (progress === undefined && status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide progress or status to update.',
      });
    }

    // 3. Validate progress if supplied
    if (progress !== undefined) {
      if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0 || progress > 100) {
        return res.status(400).json({
          success: false,
          message: 'Progress must be a number between 0 and 100.',
        });
      }
    }

    // 4. Validate status if supplied
    let normalizedStatus;
    if (status !== undefined) {
      if (typeof status !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Status must be a string.',
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

    // 5. Reject contradictory combinations when both progress and status are supplied
    if (progress !== undefined && normalizedStatus !== undefined) {
      if (normalizedStatus === 'COMPLETED' && progress < 100) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set status to COMPLETED with progress below 100.',
        });
      }
      if (normalizedStatus === 'NOT_STARTED' && progress > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set status to NOT_STARTED with progress above 0.',
        });
      }
      if (progress === 100 && (normalizedStatus === 'IN_PROGRESS' || normalizedStatus === 'NOT_STARTED')) {
        return res.status(400).json({
          success: false,
          message: `Cannot set status to ${normalizedStatus} with progress of 100.`,
        });
      }
    }

    // 6. Query record strictly within authenticated user's ownership context
    const record = await LearningProgress.findOne({
      _id: id.trim(),
      user: userId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Learning record not found.',
      });
    }

    // 7. Apply state transitions and maintain consistent timestamps
    if (progress !== undefined) {
      record.progress = progress;
      if (progress === 100 && normalizedStatus === undefined) {
        record.status = 'COMPLETED';
      } else if (progress > 0 && progress < 100 && normalizedStatus === undefined && record.status === 'NOT_STARTED') {
        record.status = 'IN_PROGRESS';
      }
    }

    if (normalizedStatus !== undefined) {
      record.status = normalizedStatus;
      if (normalizedStatus === 'COMPLETED' && progress === undefined) {
        record.progress = 100;
      } else if (normalizedStatus === 'NOT_STARTED' && progress === undefined) {
        record.progress = 0;
      }
    }

    // Manage timestamps based on final status & progress
    if (record.status === 'COMPLETED') {
      if (!record.startedAt) record.startedAt = new Date();
      if (!record.completedAt) record.completedAt = new Date();
      record.progress = 100;
    } else if (record.status === 'IN_PROGRESS') {
      if (!record.startedAt) record.startedAt = new Date();
      record.completedAt = null;
    } else if (record.status === 'NOT_STARTED') {
      record.progress = 0;
      record.startedAt = null;
      record.completedAt = null;
    }

    await record.save();
    await record.populate('resource');

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a learning record from the authenticated user's library
 * @route   DELETE /api/learning/:id
 * @access  Private (Authenticated)
 */
export const deleteLearningRecord = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // 1. Validate ID format
    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid learning record ID format.',
      });
    }

    // 2. Delete record strictly scoped to authenticated user
    const deletedRecord = await LearningProgress.findOneAndDelete({
      _id: id.trim(),
      user: userId,
    });

    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Learning record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resource removed from learning library.',
    });
  } catch (error) {
    next(error);
  }
};
