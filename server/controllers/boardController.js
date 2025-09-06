const Board = require('../models/Board');
const User = require('../models/User');

// @desc    Create new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
  try {
    const { title, description, isPublic } = req.body;

    const board = await Board.create({
      title: title || 'Untitled Board',
      description: description || '',
      owner: req.user.id,
      isPublic: isPublic || false,
      data: {
        lines: [],
        rectangles: [],
        textNodes: [],
        circles: [],
        arrows: []
      }
    });

    // Add board to user's boards array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { boards: board._id }
    });

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      board: populatedBoard
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
    console.error('Get boards error:', error);
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
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user has access to this board
    const hasAccess = board.owner._id.toString() === req.user.id ||
                     board.collaborators.some(collab => collab.user._id.toString() === req.user.id) ||
                     board.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this board' });
    }

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
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is owner or has edit access
    const isOwner = board.owner.toString() === req.user.id;
    const isEditor = board.collaborators.some(collab => 
      collab.user.toString() === req.user.id && 
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

module.exports = {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  addCollaborator,
  removeCollaborator
};
