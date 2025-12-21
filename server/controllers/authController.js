// Import User model to interact with users collection in MongoDB
const User = require('../models/User');
// Import utility function to generate JWT tokens
const generateToken = require('../utils/generateToken');

/**
 * REGISTER NEW USER
 * @description Register a new user account in the system
 * @route       POST /api/auth/register
 * @access      Public (anyone can register)
 */
const registerUser = async (req, res) => {
  try {
    // Extract user data from request body
    const { name, email, password } = req.body;

    // VALIDATION: Check if all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide name, email and password'
      });
    }

    // VALIDATION: Ensure password meets minimum length requirement
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }

    // CHECK: Verify if user with this email already exists in database
    const userExists = await User.findOne({ email });
    if (userExists) {
      // Return error if email is already registered
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // CREATE: Save new user to database
    // Password will be automatically hashed by the pre-save hook in User model
    const user = await User.create({
      name,
      email,
      password
    });

    // GENERATE: Create JWT token for the new user
    // This allows them to stay logged in
    const token = generateToken(user._id);

    // RESPONSE: Send success response with user data and token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: user._id,       // User's unique ID
        name: user.name,     // User's name
        email: user.email,   // User's email
        createdAt: user.createdAt // Account creation timestamp
      },
      token // JWT token for authentication
    });
  } catch (error) {
    // ERRORHANDLING: Log error and send error response
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration',
      error: error.message
    });
  }
};

/**
 * LOGIN USER
 * @description Authenticate user with email and password
 * @route       POST /api/auth/login
 * @access      Public (anyone can attempt login)
 */
const loginUser = async (req, res) => {
  try {
    // Extract login credentials from request body
    const { email, password } = req.body;
    
    // LOG: Track login attempt
    console.log('🔐 Login attempt for email:', email);

    // VALIDATION: Check if both email and password are provided
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    // LOOKUP: Find user by email and include password field
    // Note: password is excluded by default (select: false in schema)
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');
    
    // CHECK: Verify user exists in database
    if (!user) {
      console.log('❌ User not found for email:', email);
      // Use generic error message for security (don't reveal if email exists)
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // VERIFY: Compare provided password with hashed password in database
    console.log('🔑 Checking password...');
    const isPasswordValid = await user.matchPassword(password);
    console.log('🔑 Password valid:', isPasswordValid);
    
    // CHECK: If password doesn't match, return error
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      // Use generic error message for security
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // UPDATE: Set user's last active timestamp to current time
    user.lastActive = Date.now();
    await user.save();

    // GENERATE: Create JWT token for the authenticated user
    const token = generateToken(user._id);
    console.log('✅ Login successful for user:', user.name);

    // RESPONSE: Send success response with user data and token
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,           // User's unique ID
        name: user.name,         // User's name
        email: user.email,       // User's email
        lastActive: user.lastActive // Last login timestamp
      },
      token // JWT token for maintaining session
    });
  } catch (error) {
    // ERROR HANDLING: Log error and send error response
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      error: error.message
    });
  }
};

/**
 * GET CURRENT USER PROFILE
 * @description Retrieve logged-in user's profile information
 * @route       GET /api/auth/me
 * @access      Private (requires authentication)
 */
const getMe = async (req, res) => {
  try {
    // FETCH: Get user by ID (set by protect middleware)
    // populate() retrieves related board documents
    const user = await User.findById(req.user.id).populate('boards', 'title description createdAt lastModified');
    
    // RESPONSE: Send user profile data
    res.json({
      success: true,
      user: {
        _id: user._id,         // User's unique ID
        name: user.name,       // User's name
        email: user.email,     // User's email
        avatar: user.avatar,   // Profile picture URL
        boards: user.boards,   // List of user's boards
        createdAt: user.createdAt,   // Account creation date
        lastActive: user.lastActive   // Last activity timestamp
      }
    });
  } catch (error) {
    // ERROR HANDLING: Log error and send error response
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Server error getting user profile',
      error: error.message
    });
  }
};

/**
 * UPDATE USER PROFILE
 * @description Update user's name and/or email
 * @route       PUT /api/auth/profile
 * @access      Private (requires authentication)
 */
const updateProfile = async (req, res) => {
  try {
    // Extract updated fields from request body
    const { name, email } = req.body;
    
    // FETCH: Get current user from database
    const user = await User.findById(req.user.id);

    // CHECK: Verify user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // UPDATE: Modify name if provided
    if (name) user.name = name;
    
    // UPDATE: Modify email if provided
    if (email) {
      // CHECK: Ensure email is not already used by another user
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // SAVE: Persist changes to database
    await user.save();

    // RESPONSE: Send updated user data
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,       // User's unique ID
        name: user.name,     // Updated name
        email: user.email,   // Updated email
        avatar: user.avatar  // Profile picture
      }
    });
  } catch (error) {
    // ERROR HANDLING: Log error and send error response
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error updating profile',
      error: error.message
    });
  }
};

/**
 * CHANGE PASSWORD
 * @description Change user's password after verifying current password
 * @route       PUT /api/auth/password
 * @access      Private (requires authentication)
 */
const changePassword = async (req, res) => {
  try {
    // Extract passwords from request body
    const { currentPassword, newPassword } = req.body;

    // VALIDATION: Check if both passwords are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Please provide current password and new password'
      });
    }

    // VALIDATION: Ensure new password meets minimum length requirement
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters'
      });
    }

    // FETCH: Get user with password field (excluded by default)
    const user = await User.findById(req.user.id).select('+password');
    
    // VERIFY: Check if current password is correct
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect'
      });
    }

    // UPDATE: Set new password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // RESPONSE: Send success message
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    // ERROR HANDLING: Log error and send error response
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Server error changing password',
      error: error.message
    });
  }
};













/**
 * EMAIL DIGIT REPLACEMENT (Custom Feature)
 * @description Replace all numeric digits in email with # symbol
 * @route       GET /api/auth/email-digit-sum
 * @access      Public
 * @example     user123@example.com becomes user###@example.com
 */
const getEmailDigitSum = async (req, res) => {
  try {
    // Extract email from query parameters (e.g., ?email=test@example.com)
    const { email } = req.query;

    // VALIDATION: Check if email parameter is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    // VALIDATION: Verify email format using regular expression
    // Pattern checks for: text@text.text format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // PROCESS: Replace all numeric digits (0-9) with # symbol
    let modifiedEmail = ''; // Initialize empty string for result
    
    // Loop through each character in the email
    for (let char of email) {
      // Check if character is a digit (0-9)
      if (char >= '0' && char <= '9') {
        modifiedEmail += '#'; // Replace digit with #
      } else {
        modifiedEmail += char; // Keep non-digit characters as is
      }
    }

    // RESPONSE: Send both original and modified email
    res.status(200).json({
      success: true,
      message: 'Email digits replaced with # symbol successfully',
      data: {
        originalEmail: email,         // Original email address
        modifiedEmail: modifiedEmail, // Email with digits replaced
        explanation: `All digits in the email address have been replaced with # symbol`
      }
    });

  } catch (error) {
    // ERROR HANDLING: Log error and send error response
    console.error('Error calculating email digit sum:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating digit sum',
      error: error.message
    });
  }
};

// EXPORT: Make all controller functions available to routes
module.exports = {
  registerUser,      // POST /api/auth/register
  loginUser,         // POST /api/auth/login
  getMe,             // GET /api/auth/me
  updateProfile,     // PUT /api/auth/profile
  changePassword,    // PUT /api/auth/password
  getEmailDigitSum   // GET /api/auth/email-digit-sum
};
