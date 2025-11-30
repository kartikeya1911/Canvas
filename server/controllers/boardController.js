const Board = require('../models/Board');
const User = require('../models/User');

// @desc    Create new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
  try {
    const { title, description, isPublic, allowAnonymous } = req.body;

    const board = await Board.create({
      title: title || 'Untitled Board',
      description: description || '',
      owner: req.user.id,
      isPublic: isPublic || false,
      allowAnonymous: allowAnonymous !== undefined ? allowAnonymous : true,
      data: {
        lines: [],
        rectangles: [],
        textNodes: [],
        circles: [],
        arrows: [],
        stickyNotes: [],
        background: '#ffffff',
        gridEnabled: false
      }
    });

    // Add board to user's boards array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { boards: board._id }
    });

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    // Use auto-detected IP from global variable
    const clientUrl = global.CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:3000';

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      board: {
        ...populatedBoard.toObject(),
        inviteUrl: populatedBoard.getInviteUrl(clientUrl)
      }
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({
      message: 'Server error creating board',
      error: error.message
    });
  }
};

// @desc    Get all boards for user
// @route   GET /api/boards
// @access  Private
const getBoards = async (req, res) => {
  try {
    console.log('📋 Getting boards for user:', req.user.id, req.user.name);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get boards where user is owner or collaborator
    const boards = await Board.find({
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    })
    .populate('owner', 'name email')
    .populate('collaborators.user', 'name email')
    .sort({ lastModified: -1 })
    .skip(skip)
    .limit(limit)
    .select('-data'); // Exclude board data for list view

    const total = await Board.countDocuments({
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    });

    console.log(`✅ Found ${boards.length} boards for user ${req.user.name}`);

    res.json({
      success: true,
      boards,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Get boards error:', error);
    res.status(500).json({
      message: 'Server error getting boards',
      error: error.message
    });
  }
};

// @desc    Get board by ID
// @route   GET /api/boards/:id
// @access  Private
const getBoard = async (req, res) => {
  try {
    let board;
    const { id } = req.params;
    
    console.log('🔍 Getting board with ID:', id);
    
    // Check if it's a MongoDB ObjectId or UUID
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    if (isObjectId) {
      console.log('📌 Searching by MongoDB ObjectId');
      board = await Board.findById(id)
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email');
    } else if (isUUID) {
      console.log('🔗 Searching by boardId (UUID)');
      board = await Board.findOne({ boardId: id })
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email');
    } else {
      console.log('❌ Invalid ID format');
      return res.status(400).json({ message: 'Invalid board ID format' });
    }

    if (!board) {
      console.log('❌ Board not found');
      return res.status(404).json({ message: 'Board not found' });
    }

    console.log('✅ Board found:', board.title);

    // Check if user has access to this board
    const hasAccess = board.owner._id.toString() === req.user.id ||
                     board.collaborators.some(collab => collab.user._id.toString() === req.user.id) ||
                     board.isPublic;

    if (!hasAccess) {
      console.log('🚫 Access denied for user:', req.user.name);
      return res.status(403).json({ message: 'Access denied to this board' });
    }

    console.log('✅ Access granted to user:', req.user.name);
    
    res.json({
      success: true,
      board
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({
      message: 'Server error getting board',
      error: error.message
    });
  }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    let board;
    
    // Check if it's a MongoDB ObjectId or UUID
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    if (isObjectId) {
      board = await Board.findById(id);
    } else if (isUUID) {
      board = await Board.findOne({ boardId: id });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid board ID format'
      });
    }

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is owner or has edit access
    const isOwner = board.owner.toString() === req.user.id;
    const isEditor = board.collaborators.some(collab => 
      collab.user && collab.user.toString() === req.user.id && 
      ['editor', 'admin'].includes(collab.role)
    );

    if (!isOwner && !isEditor) {
      return res.status(403).json({ message: 'Not authorized to edit this board' });
    }

    // Update allowed fields
    const { title, description, isPublic, data, settings } = req.body;
    
    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    if (isOwner && isPublic !== undefined) board.isPublic = isPublic;
    if (data !== undefined) board.data = { ...board.data, ...data };
    if (settings !== undefined) board.settings = { ...board.settings, ...settings };

    await board.save();

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    res.json({
      success: true,
      message: 'Board updated successfully',
      board: updatedBoard
    });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({
      message: 'Server error updating board',
      error: error.message
    });
  }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only owner can delete board
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this board' });
    }

    await Board.findByIdAndDelete(req.params.id);

    // Remove board from user's boards array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { boards: board._id }
    });

    res.json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({
      message: 'Server error deleting board',
      error: error.message
    });
  }
};

// @desc    Add collaborator to board
// @route   POST /api/boards/:id/collaborators
// @access  Private
const addCollaborator = async (req, res) => {
  try {
    const { email, role = 'editor' } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only owner can add collaborators
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only board owner can add collaborators' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if user is already a collaborator
    const isAlreadyCollaborator = board.collaborators.some(
      collab => collab.user.toString() === user._id.toString()
    );

    if (isAlreadyCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    // Add collaborator
    board.collaborators.push({
      user: user._id,
      role,
      joinedAt: new Date()
    });

    await board.save();

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      board: updatedBoard
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      message: 'Server error adding collaborator',
      error: error.message
    });
  }
};

// @desc    Remove collaborator from board
// @route   DELETE /api/boards/:id/collaborators/:userId
// @access  Private
const removeCollaborator = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only owner can remove collaborators
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only board owner can remove collaborators' });
    }

    // Remove collaborator
    board.collaborators = board.collaborators.filter(
      collab => collab.user.toString() !== req.params.userId
    );

    await board.save();

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    res.json({
      success: true,
      message: 'Collaborator removed successfully',
      board: updatedBoard
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      message: 'Server error removing collaborator',
      error: error.message
    });
  }
};

// @desc    Get board by boardId (for invite links)
// @route   GET /api/boards/invite/:boardId
// @access  Public
const getBoardByInvite = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    console.log('🔗 Getting board by invite with boardId:', boardId);
    
    const board = await Board.findOne({ boardId })
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    console.log('🔍 Board lookup result:', board ? `Found: ${board.title}` : 'Not found');

    if (!board) {
      console.log('❌ Board not found for boardId:', boardId);
      return res.status(404).json({ 
        success: false,
        message: 'Board not found or invite link is invalid' 
      });
    }

    console.log('✅ Board found:', board.title, 'allowAnonymous:', board.allowAnonymous);

    // Check if board allows anonymous access
    if (!board.allowAnonymous && !req.user) {
      console.log('🔒 Board requires authentication, user not authenticated');
      return res.status(401).json({
        success: false,
        message: 'This board requires authentication to access'
      });
    }

    // If user is authenticated, check permissions
    if (req.user) {
      console.log('👤 User authenticated:', req.user.name);
      const hasPermission = board.hasPermission(req.user.id);
      console.log('🔐 User permission check:', hasPermission);
      
      if (!hasPermission && !board.isPublic && !board.allowAnonymous) {
        console.log('🚫 User does not have permission');
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this board'
        });
      }
    } else {
      console.log('👻 Anonymous access');
    }

    console.log('✅ Access granted, returning board info');
    
    // Use auto-detected IP from global variable
    const clientUrl = global.CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    
    res.json({
      success: true,
      board: {
        ...board.toObject(),
        inviteUrl: board.getInviteUrl(clientUrl)
      }
    });
  } catch (error) {
    console.error('Get board by invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error accessing board',
      error: error.message
    });
  }
};

// @desc    Generate new invite link for board
// @route   POST /api/boards/:id/invite
// @access  Private (Owner only)
const generateInviteLink = async (req, res) => {
  try {
    let board;
    const { id } = req.params;
    
    // Check if it's a MongoDB ObjectId or UUID
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    if (isObjectId) {
      board = await Board.findById(id);
    } else if (isUUID) {
      board = await Board.findOne({ boardId: id });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid board ID format'
      });
    }

    if (!board) {
      return res.status(404).json({ 
        success: false,
        message: 'Board not found' 
      });
    }

    // Only owner can generate invite links
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only board owner can generate invite links'
      });
    }

    // Ensure board has a boardId (for existing boards without one)
    if (!board.boardId) {
      board.boardId = require('crypto').randomUUID();
    }

    // Update board settings if provided
    const { allowAnonymous, defaultPermission } = req.body;
    if (allowAnonymous !== undefined) {
      board.allowAnonymous = allowAnonymous;
    }
    if (defaultPermission && ['viewer', 'editor'].includes(defaultPermission)) {
      board.defaultPermission = defaultPermission;
    }

    await board.save();

    // Use auto-detected IP from global variable for cross-device sharing
    const clientUrl = global.CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:3000';

    res.json({
      success: true,
      inviteUrl: board.getInviteUrl(clientUrl),
      boardId: board.boardId,
      settings: {
        allowAnonymous: board.allowAnonymous,
        defaultPermission: board.defaultPermission
      }
    });
  } catch (error) {
    console.error('Generate invite link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating invite link',
      error: error.message
    });
  }
};

// @desc    Join board via invite link
// @route   POST /api/boards/join/:boardId
// @access  Public/Private
const joinBoardViaInvite = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    const board = await Board.findOne({ boardId })
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found or invite link is invalid'
      });
    }

    // Clean up null collaborators (users that were deleted)
    board.collaborators = board.collaborators.filter(collab => collab.user != null);
    if (board.collaborators.length !== board.collaborators.length) {
      await board.save();
    }

    // If user is not authenticated and board doesn't allow anonymous access
    if (!req.user && !board.allowAnonymous) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to join this board'
      });
    }

    // If user is authenticated
    if (req.user) {
      // Check if user is already owner
      if (board.owner._id.toString() === req.user.id) {
        const clientUrl = global.CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:3000';
        return res.json({
          success: true,
          message: 'You are the owner of this board',
          board: {
            ...board.toObject(),
            inviteUrl: board.getInviteUrl(clientUrl)
          }
        });
      }

      // Check if user is already a collaborator
      const existingCollaborator = board.collaborators.find(
        collab => collab.user && collab.user._id && collab.user._id.toString() === req.user.id
      );

      if (!existingCollaborator) {
        // Add user as collaborator
        board.collaborators.push({
          user: req.user.id,
          role: board.defaultPermission,
          inviteUsed: true,
          joinedAt: new Date()
        });

        await board.save();
        
        // Add board to user's boards
        await User.findByIdAndUpdate(req.user.id, {
          $addToSet: { boards: board._id }
        });
      }

      // Populate the updated board
      const updatedBoard = await Board.findById(board._id)
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email');

      const clientUrl = global.CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:3000';

      res.json({
        success: true,
        message: existingCollaborator ? 'Already a member of this board' : 'Successfully joined the board',
        board: {
          ...updatedBoard.toObject(),
          inviteUrl: updatedBoard.getInviteUrl(clientUrl)
        }
      });
    } else {
      // Anonymous access
      const clientUrl = global.CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:3000';
      res.json({
        success: true,
        message: 'Anonymous access granted',
        board: {
          ...board.toObject(),
          inviteUrl: board.getInviteUrl(clientUrl)
        },
        anonymous: true
      });
    }
  } catch (error) {
    console.error('Join board via invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error joining board',
      error: error.message
    });
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  addCollaborator,
  removeCollaborator,
  getBoardByInvite,
  generateInviteLink,
  joinBoardViaInvite
};
