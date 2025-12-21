// Import mongoose for MongoDB object modeling
const mongoose = require('mongoose');

/**
 * Board Schema Definition
 * Defines the structure of whiteboard documents in MongoDB
 * Each board represents a collaborative whiteboard canvas
 */
const BoardSchema = new mongoose.Schema({
  // Board title/name
  title: {
    type: String, // Data type is string
    required: [true, 'Board title is required'], // Field is mandatory
    trim: true, // Remove whitespace from beginning and end
    maxlength: [100, 'Title cannot be more than 100 characters'], // Maximum length constraint
    default: 'Untitled Board' // Default value if not provided
  },
  
  // Board description (optional)
  description: {
    type: String, // Data type is string
    maxlength: [500, 'Description cannot be more than 500 characters'], // Maximum length
    default: '' // Empty string by default
  },
  
  // Unique board ID (UUID) for generating invite links
  // This is different from MongoDB's _id and is used for sharing
  boardId: {
    type: String, // Data type is string
    unique: true, // Must be unique across all boards
    required: true, // Field is mandatory
    default: () => require('crypto').randomUUID() // Generate random UUID automatically
  },
  
  // Reference to the User who created this board
  owner: {
    type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId reference
    ref: 'User', // References the User model
    required: true // Every board must have an owner
  },
  
  // Array of collaborators who have access to this board
  collaborators: [{
    // Reference to User document
    user: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId reference
      ref: 'User' // References the User model
    },
    // Collaborator's permission level
    role: {
      type: String, // Data type is string
      enum: ['viewer', 'editor', 'admin'], // Only these 3 values are allowed
      default: 'editor' // Default role is editor
    },
    // When the collaborator joined
    joinedAt: {
      type: Date, // Data type is date
      default: Date.now // Automatically set to current time
    },
    // Whether they used an invite link to join
    inviteUsed: {
      type: Boolean, // Data type is boolean
      default: false // Default is false
    }
  }],
  
  // Whether the board is publicly accessible
  isPublic: {
    type: Boolean, // Data type is boolean
    default: false // Boards are private by default
  },
  
  // Whether anonymous users can access the board
  allowAnonymous: {
    type: Boolean, // Data type is boolean
    default: true // Allow anonymous access by default
  },
  
  // Default permission level for new collaborators
  defaultPermission: {
    type: String, // Data type is string
    enum: ['viewer', 'editor'], // Only viewer or editor allowed
    default: 'editor' // New users get editor access by default
  },
  
  // Optional password protection for the board
  password: {
    type: String, // Data type is string
    select: false // Don't include in query results by default (for security)
  },
  
  // The actual whiteboard data containing all drawings
  data: {
    // Array of freehand lines drawn on the board
    lines: [{ type: mongoose.Schema.Types.Mixed }], // Mixed type allows any object structure
    
    // Array of rectangle shapes
    rectangles: [{ type: mongoose.Schema.Types.Mixed }],
    
    // Array of circle shapes
    circles: [{ type: mongoose.Schema.Types.Mixed }],
    
    // Array of arrow shapes
    arrows: [{ type: mongoose.Schema.Types.Mixed }],
    
    // Array of text elements
    textNodes: [{ type: mongoose.Schema.Types.Mixed }],
    
    // Array of sticky notes
    stickyNotes: [{ type: mongoose.Schema.Types.Mixed }],
    
    // Background color of the board
    background: {
      type: String, // Data type is string (hex color code)
      default: '#ffffff' // White background by default
    },
    
    // Whether to show grid lines on the board
    gridEnabled: {
      type: Boolean, // Data type is boolean
      default: false // Grid is disabled by default
    }
  },
  
  // Array of currently active users on this board
  activeUsers: [{ type: mongoose.Schema.Types.Mixed }],
  
  // Total number of edits made to this board
  totalEdits: {
    type: Number, // Data type is number
    default: 0 // Starts at 0
  },
  
  // Timestamp of last activity on this board
  lastActivity: {
    type: Date, // Data type is date
    default: Date.now // Set to current time by default
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

<<<<<<< HEAD
/**
 * Database Indexes for Performance Optimization
 * Indexes speed up queries on frequently searched fields
 */
// Index on boardId for fast lookup when using invite links
BoardSchema.index({ boardId: 1 }); // 1 means ascending order

// Index on owner for fast lookup of boards owned by a user
=======
// Indexes for performance (boardId already has unique index from schema)
>>>>>>> dea45aa6c3a632f17db74d1104dfc9072effc0fd
BoardSchema.index({ owner: 1 });

// Index on collaborators for fast lookup of boards where user is collaborator
BoardSchema.index({ 'collaborators.user': 1 });

BoardSchema.methods.getInviteUrl = function(baseUrl) {
  const url = baseUrl || global.CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:3000';
  return `${url}/invite/${this.boardId}`;
};

/**
 * Instance method to check if a user has specific permission on this board
 * Used to verify access rights before allowing operations
 * 
 * @param {String} userId - The user's MongoDB ObjectId
 * @param {String} requiredPermission - Permission level needed (viewer/editor/admin)
 * @returns {Boolean} - True if user has required permission, false otherwise
 */
BoardSchema.methods.hasPermission = function(userId, requiredPermission = 'viewer') {
  // Owner always has all permissions
  if (this.owner.toString() === userId) {
    return true;
  }

  // Find the user in collaborators array
  const collaborator = this.collaborators.find(
    collab => collab.user && collab.user.toString() === userId
  );

  if (!collaborator) {
    // If not a collaborator, check if board allows public/anonymous access
    return this.isPublic || this.allowAnonymous;
  }

  // Define permission hierarchy (higher number = more permissions)
  const permissions = { 'viewer': 0, 'editor': 1, 'admin': 2 };
  
  // Check if user's role meets the required permission level
  return permissions[collaborator.role] >= permissions[requiredPermission];
};

// Create and export the Board model based on BoardSchema
// This model is used to interact with the 'boards' collection in MongoDB
module.exports = mongoose.model('Board', BoardSchema);
