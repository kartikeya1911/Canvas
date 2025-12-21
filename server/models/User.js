// Import mongoose for MongoDB object modeling
const mongoose = require('mongoose');
// Import bcrypt for password hashing (encryption)
const bcrypt = require('bcryptjs');

/**
 * User Schema Definition
 * Defines the structure of User documents in MongoDB
 * This schema includes validation rules and field constraints
 */
const UserSchema = new mongoose.Schema({
  // User's full name
  name: {
    type: String, // Data type is string
    required: [true, 'Name is required'], // Field is mandatory with custom error message
    trim: true, // Remove whitespace from beginning and end
    maxlength: [50, 'Name cannot be more than 50 characters'] // Maximum length constraint
  },
  
  // User's email address (used for login)
  email: {
    type: String, // Data type is string
    required: [true, 'Email is required'], // Field is mandatory
    unique: true, // Email must be unique across all users (no duplicates)
    lowercase: true, // Convert email to lowercase before saving
    match: [
      // Regular expression to validate email format
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email' // Error message if validation fails
    ]
  },
  
  // User's password (will be hashed before storage)
  password: {
    type: String, // Data type is string
    required: [true, 'Password is required'], // Field is mandatory
    minlength: 6, // Minimum 6 characters required for security
    select: false // Don't include password in query results by default (for security)
  },
  
  // User's profile picture URL (optional)
  avatar: {
    type: String, // Data type is string (URL to image)
    default: null // Default value if not provided
  },
  
  // Array of board IDs that this user owns or collaborates on
  boards: [{
    type: mongoose.Schema.Types.ObjectId, // Reference to Board documents
    ref: 'Board' // Name of the referenced model
  }],
  
  // Timestamp when user account was created
  createdAt: {
    type: Date, // Data type is date
    default: Date.now // Automatically set to current date/time when created
  },
  
  // Timestamp when user was last active in the application
  lastActive: {
    type: Date, // Data type is date
    default: Date.now // Automatically set to current date/time
  }
});

/**
 * Pre-save middleware (hook) to hash password before saving to database
 * This runs automatically before a user document is saved
 * Passwords are never stored in plain text for security
 */
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    next(); // Skip hashing if password hasn't changed
  }
  
  // Generate a salt (random data) for hashing
  // Higher number = more secure but slower (10 is a good balance)
  const salt = await bcrypt.genSalt(10);
  
  // Hash the password with the salt
  // This creates a one-way encrypted version of the password
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method to compare entered password with hashed password
 * Used during login to verify if the password is correct
 * 
 * @param {String} enteredPassword - Plain text password entered by user
 * @returns {Promise<Boolean>} - True if passwords match, false otherwise
 */
UserSchema.methods.matchPassword = async function(enteredPassword) {
  // Compare plain text password with hashed password in database
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model based on UserSchema
// This model is used to interact with the 'users' collection in MongoDB
module.exports = mongoose.model('User', UserSchema);
