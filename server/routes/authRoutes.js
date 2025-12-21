// Import Express router to define routes
const express = require('express');

// Import authentication controller functions that handle the business logic
const {
  registerUser,    // Handles user registration
  loginUser,       // Handles user login
  getMe,           // Gets current user profile
  updateProfile,   // Updates user profile information
  changePassword,  // Changes user password
  getEmailDigitSum // Custom function to process email digits
} = require('../controllers/authController');

// Import authentication middleware to protect routes
const { protect } = require('../middleware/authMiddleware');

// Create a new Express router instance
const router = express.Router();

/**
 * PUBLIC ROUTES - No authentication required
 * These routes can be accessed without a valid JWT token
 */

// POST /api/auth/register - Register a new user account
router.post('/register', registerUser);

// POST /api/auth/login - Login with email and password
router.post('/login', loginUser);

// GET /api/auth/email-digit-sum - Get sum of digits in email (demo feature)
router.get('/email-digit-sum', getEmailDigitSum);

/**
 * PROTECTED ROUTES - Authentication required
 * These routes require a valid JWT token in the Authorization header
 * The 'protect' middleware verifies the token before allowing access
 */

// GET /api/auth/me - Get current logged-in user's profile
router.get('/me', protect, getMe);

// PUT /api/auth/profile - Update user profile (name, email, avatar)
router.put('/profile', protect, updateProfile);

// PUT /api/auth/password - Change user password
router.put('/password', protect, changePassword);

// Export the router to be used in server.js
module.exports = router;
