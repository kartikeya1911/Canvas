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
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null
  },
  data: {
    lines: [{
      tool: String,
      points: [Number],
      color: String,
      thickness: Number,
      id: String,
      timestamp: { type: Date, default: Date.now }
    }],
    rectangles: [{
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      color: String,
      thickness: Number,
      id: String,
      timestamp: { type: Date, default: Date.now }
    }],
    textNodes: [{
      x: Number,
      y: Number,
      text: String,
      fontSize: Number,
      color: String,
      id: String,
      timestamp: { type: Date, default: Date.now }
    }],
    circles: [{
      x: Number,
      y: Number,
      radius: Number,
      color: String,
      thickness: Number,
      id: String,
      timestamp: { type: Date, default: Date.now }
    }],
    arrows: [{
      points: [Number],
      color: String,
      thickness: Number,
      id: String,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  settings: {
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    gridEnabled: {
      type: Boolean,
      default: true
    },
    gridSize: {
      type: Number,
      default: 40
    },
    snapToGrid: {
      type: Boolean,
      default: false
    }
  },
  version: {
    type: Number,
    default: 1
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update lastModified on save
BoardSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

// Index for performance
BoardSchema.index({ owner: 1, createdAt: -1 });
BoardSchema.index({ 'collaborators.user': 1 });
BoardSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Board', BoardSchema);
