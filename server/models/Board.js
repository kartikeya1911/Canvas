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
    inviteUsed: {
      type: Boolean,
      default: false
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  allowAnonymous: {
    type: Boolean,
    default: true
  },
  defaultPermission: {
    type: String,
    enum: ['viewer', 'editor'],
    default: 'editor'
  },
  password: {
    type: String,
    select: false
  },
  data: {
    lines: [{ type: mongoose.Schema.Types.Mixed }],
    rectangles: [{ type: mongoose.Schema.Types.Mixed }],
    circles: [{ type: mongoose.Schema.Types.Mixed }],
    arrows: [{ type: mongoose.Schema.Types.Mixed }],
    textNodes: [{ type: mongoose.Schema.Types.Mixed }],
    stickyNotes: [{ type: mongoose.Schema.Types.Mixed }],
    background: {
      type: String,
      default: '#ffffff'
    },
    gridEnabled: {
      type: Boolean,
      default: false
    }
  },
  activeUsers: [{ type: mongoose.Schema.Types.Mixed }],
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

// Indexes for performance (boardId already has unique index from schema)
BoardSchema.index({ owner: 1 });
BoardSchema.index({ 'collaborators.user': 1 });

// Method to generate invite URL
BoardSchema.methods.getInviteUrl = function(baseUrl) {
  // Use provided baseUrl, global CLIENT_URL (auto-detected IP), or fallback to localhost
  const url = baseUrl || global.CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:3000';
  return `${url}/invite/${this.boardId}`;
};

// Method to check user permissions
BoardSchema.methods.hasPermission = function(userId, requiredPermission = 'viewer') {
  // Owner has all permissions
  if (this.owner.toString() === userId) {
    return true;
  }

  // Check if user is a collaborator
  const collaborator = this.collaborators.find(
    collab => collab.user && collab.user.toString() === userId
  );

  if (!collaborator) {
    // If not a collaborator, check if board allows public/anonymous access
    return this.isPublic || this.allowAnonymous;
  }

  // Check permission level
  const permissions = { 'viewer': 0, 'editor': 1, 'admin': 2 };
  return permissions[collaborator.role] >= permissions[requiredPermission];
};

module.exports = mongoose.model('Board', BoardSchema);
