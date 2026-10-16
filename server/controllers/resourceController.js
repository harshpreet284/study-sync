import mongoose from 'mongoose';
import { Resource } from '../models/Resource.js';

const VALID_TYPES = ['COURSE', 'VIDEO', 'ARTICLE', 'DOCUMENTATION', 'TUTORIAL', 'BOOK'];
const VALID_DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

/**
 * Escapes characters with special meaning in regular expressions to prevent ReDoS
 * or unexpected pattern injection when performing text search.
 *
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for RegExp
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @desc    Get resources with optional search, category, difficulty, and type filters
 * @route   GET /api/resources
 * @access  Public
 */
export const getResources = async (req, res, next) => {
  try {
    const { search, category, difficulty, type } = req.query;
    const filter = {};

    // 1. Validate search parameter (must be single string <= 200 chars)
    if (search !== undefined) {
      if (typeof search !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search parameter must be a single string.',
        });
      }
      const trimmedSearch = search.trim();
      if (trimmedSearch.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Search query exceeds maximum length of 200 characters.',
        });
      }
      if (trimmedSearch.length > 0) {
        const searchRegex = new RegExp(escapeRegex(trimmedSearch), 'i');
        filter.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { skills: searchRegex },
        ];
      }
    }

    // 2. Validate and normalize category parameter (must be single string)
    if (category !== undefined) {
      if (typeof category !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Category parameter must be a single string.',
        });
      }
      const trimmedCategory = category.trim();
      if (trimmedCategory.length > 0) {
        filter.category = new RegExp(`^${escapeRegex(trimmedCategory)}$`, 'i');
      }
    }

    // 3. Validate and normalize difficulty parameter (must be single string)
    if (difficulty !== undefined) {
      if (typeof difficulty !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Difficulty parameter must be a single string.',
        });
      }
      const trimmedDifficulty = difficulty.trim();
      if (trimmedDifficulty.length > 0) {
        const normalizedDifficulty = trimmedDifficulty.toUpperCase();
        if (!VALID_DIFFICULTIES.includes(normalizedDifficulty)) {
          return res.status(400).json({
            success: false,
            message: `Invalid difficulty: '${difficulty}'. Allowed values: ${VALID_DIFFICULTIES.join(', ')}`,
          });
        }
        filter.difficulty = normalizedDifficulty;
      }
    }

    // 4. Validate and normalize type parameter (must be single string)
    if (type !== undefined) {
      if (typeof type !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Resource type parameter must be a single string.',
        });
      }
      const trimmedType = type.trim();
      if (trimmedType.length > 0) {
        const normalizedType = trimmedType.toUpperCase();
        if (!VALID_TYPES.includes(normalizedType)) {
          return res.status(400).json({
            success: false,
            message: `Invalid resource type: '${type}'. Allowed values: ${VALID_TYPES.join(', ')}`,
          });
        }
        filter.type = normalizedType;
      }
    }

    // Execute query with deterministic catalog sorting
    const resources = await Resource.find(filter).sort({ sourceId: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single resource by MongoDB ObjectId or legacy numeric sourceId
 * @route   GET /api/resources/:id
 * @access  Public
 */
export const getResourceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID format.',
      });
    }

    const trimmedId = id.trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(trimmedId);
    const isNumericId = /^\d+$/.test(trimmedId);

    // Validate ID format before querying
    if (!isObjectId && !isNumericId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID format. Must be a valid ObjectId or numeric ID.',
      });
    }

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

    return res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};
