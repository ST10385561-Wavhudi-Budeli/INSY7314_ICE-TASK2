const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT containing the user's ID, role, and an expiry.
 * @param {object} user - A mongoose User document (or plain object with _id and role).
 * @returns {string} signed JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

module.exports = generateToken;
