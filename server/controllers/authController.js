import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Strips sensitive fields and formats user profile for client response.
 *
 * @param {object} user - Mongoose User document or plain object
 * @returns {object} Safe user object
 */
const formatSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields presence
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.',
      });
    }

    const trimmedName = String(name).trim();
    if (trimmedName.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot be empty.',
      });
    }

    // 2. Validate email format and normalize
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 3. Validate password constraints (min 8 characters, max 72 UTF-8 bytes for bcrypt limit)
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const passwordByteLength = Buffer.byteLength(password, 'utf8');
    if (passwordByteLength > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password exceeds maximum length of 72 bytes.',
      });
    }

    // 4. Check for duplicate email registration
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // 5. Hash password before storage
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Create user record
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
    });

    // 7. Generate authentication token
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      data: {
        user: formatSafeUser(user),
        token,
      },
    });
  } catch (error) {
    // Handle concurrent duplicate key race condition (E11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 2. Look up user by normalized email
    const user = await User.findOne({ email: normalizedEmail });

    // 3. Generic error for non-existent user or invalid password (prevents user enumeration)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 4. Verify password with stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 5. Generate authentication token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      data: {
        user: formatSafeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated)
 */
export const getMe = async (req, res) => {
  // req.user is guaranteed to exist and have passwordHash stripped by protect middleware
  return res.status(200).json({
    success: true,
    data: {
      user: formatSafeUser(req.user),
    },
  });
};
