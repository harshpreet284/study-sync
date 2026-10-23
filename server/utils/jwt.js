import jwt from 'jsonwebtoken';

/**
 * Generates a signed JSON Web Token containing the user's ID.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId - The MongoDB User ObjectId
 * @returns {string} The signed JWT string
 */
export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ userId: userId.toString() }, secret, {
    expiresIn,
  });
};

/**
 * Verifies and decodes a JSON Web Token.
 *
 * @param {string} token - The raw JWT token string
 * @returns {object} The decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }

  return jwt.verify(token, secret);
};
