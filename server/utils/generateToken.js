// Import jsonwebtoken library for JWT creation and verification
const jwt = require('jsonwebtoken');

/**
 * Generate JWT (JSON Web Token) for user authentication
 * JWTs are used to maintain user sessions without storing session data on server
 * 
 * @param {String} id - User's MongoDB ObjectId
 * @returns {String} - Signed JWT token containing user ID
 */
const generateToken = (id) => {
  // Create and sign a JWT with the user's ID as payload
  return jwt.sign(
    { id }, // Payload: user ID that will be encoded in the token
    process.env.JWT_SECRET || 'fallback_secret_key', // Secret key for signing (should be kept secure)
    {
      expiresIn: process.env.JWT_EXPIRE || '30d', // Token expiration time (30 days default)
    }
  );
};

// Export the generateToken function to be used in controllers
module.exports = generateToken;
