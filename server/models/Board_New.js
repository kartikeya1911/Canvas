const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Board title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
    default: 'Untitled Board'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  // Unique board ID for invite links
  boardId: {
    type: String,
    unique: true,
    required: true,
    default: () => require('crypto').randomUUID()
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'editor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    // Track if user joined via invite link
    inviteUsed: {
      type: Boolean,
      default: false
    }
  }],
  // Board access settings
  isPublic: {
    type: Boolean,
    default: false
  },
  // Allow anonymous users to join via invite
  allowAnonymous: {
    type: Boolean,
    default: true
  },
  // Default permission for new collaborators
  defaultPermission: {
    type: String,
    enum: ['viewer', 'editor'],
    default: 'editor'
  },
  password: {
    type: String,
    select: false
  },
  // Board canvas data
  data: {
    lines: [{
      id: String,
      points: [Number],
      tool: String,
      color: String,
      thickness: Number,
      timestamp: Date,
      userId: String,
      userName: String
    }],
    rectangles: [{
      id: String,
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      fill: String,
      stroke: String,
      strokeWidth: Number,
      timestamp: Date,
      userId: String,
      userName: String
    }],
    circles: [{
      id: String,
      x: Number,
      y: Number,
      radius: Number,
      fill: String,
      stroke: String,
      strokeWidth: Number,
      timestamp: Date,
      userId: String,
      userName: String
    }],
    arrows: [{
      id: String,
      points: [Number],
      fill: String,
      stroke: String,
      strokeWidth: Number,
      timestamp: Date,
      userId: String,
      userName: String
    }],
    textNodes: [{
      id: String,
      x: Number,
      y: Number,
      text: String,
      fontSize: Number,
      fontFamily: String,
      fill: String,
      width: Number,
      height: Number,
      timestamp: Date,
      userId: String,
      userName: String
    }],
    // New: Sticky notes
    stickyNotes: [{
      id: String,
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      text: String,
      color: String,
      timestamp: Date,
      userId: String,
      userName: String
    }],
    // Board settings
    background: {
      type: String,
      default: '#ffffff'
    },
    gridEnabled: {
      type: Boolean,
      default: false
    }
  },
  // Collaboration metadata
  activeUsers: [{
    userId: String,
    userName: String,
    socketId: String,
    cursor: {
      x: Number,
      y: Number
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  }],
  // Board statistics
  totalEdits: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
BoardSchema.index({ boardId: 1 });
BoardSchema.index({ owner: 1 });
BoardSchema.index({ 'collaborators.user': 1 });
BoardSchema.index({ lastActivity: -1 });

// Generate invite URL
BoardSchema.methods.getInviteUrl = function(baseUrl = 'http://localhost:3000') {
  return `${baseUrl}/board/${this.boardId}`;
};

// Check if user has permission
BoardSchema.methods.hasPermission = function(userId, requiredPermission = 'viewer') {
  // Owner has all permissions
  if (this.owner.toString() === userId) {
    return true;
  }

  // Check collaborators
  const collaborator = this.collaborators.find(
    collab => collab.user && collab.user.toString() === userId
  );

  if (!collaborator) {
    return this.isPublic || this.allowAnonymous;
  }

  const permissions = {
    'viewer': 0,
    'editor': 1,
    'admin': 2
  };

  return permissions[collaborator.role] >= permissions[requiredPermission];
};

// Update last activity
BoardSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  this.totalEdits += 1;
  return this.save();
};

module.exports = mongoose.model('Board', BoardSchema);
