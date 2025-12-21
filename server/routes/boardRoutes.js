// Import Express router to define routes
const express = require('express');

// Import board controller functions that handle the business logic
const {
  createBoard,         // Create a new whiteboard
  getBoards,          // Get all boards for current user
  getBoard,           // Get a specific board by ID
  updateBoard,        // Update board details or content
  deleteBoard,        // Delete a board
  addCollaborator,    // Add a user as collaborator to a board
  removeCollaborator, // Remove a collaborator from a board
  getBoardByInvite,   // Get board information using invite link
  generateInviteLink, // Generate shareable invite link for a board
  joinBoardViaInvite  // Join a board using invite link
} = require('../controllers/boardController');

// Import authentication middleware
// protect: Requires valid JWT token (user must be logged in)
// optionalAuth: JWT token is optional (works for both logged in and anonymous users)
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Create a new Express router instance
const router = express.Router();

/**
 * TEST ENDPOINT - For debugging and health check
 * GET /api/boards/test
 */
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Board API is working', 
    user: req.user || 'Not authenticated' // Show user if authenticated
  });
});

/**
 * PUBLIC ROUTES WITH OPTIONAL AUTHENTICATION
 * These routes work for both authenticated and anonymous users
 */

// GET /api/boards/invite/:boardId - Get board details using invite ID
// Used when someone clicks an invite link
router.get('/invite/:boardId', optionalAuth, getBoardByInvite);

// POST /api/boards/join/:boardId - Join a board using invite link
// Adds user as collaborator or allows anonymous access
router.post('/join/:boardId', optionalAuth, joinBoardViaInvite);

/**
 * PROTECTED ROUTES - Authentication Required
 * All routes below this middleware require valid JWT token
 */
router.use(protect); // Apply protect middleware to all routes below

/**
 * BOARD CRUD OPERATIONS
 */

// GET /api/boards - Get all boards for current user
// POST /api/boards - Create a new board
router.route('/')
  .get(getBoards)     // List user's boards
  .post(createBoard); // Create new board

// GET /api/boards/:id - Get specific board by ID
// PUT /api/boards/:id - Update board (title, description, data, etc.)
// DELETE /api/boards/:id - Delete a board permanently
router.route('/:id')
  .get(getBoard)      // Get single board
  .put(updateBoard)   // Update board
  .delete(deleteBoard); // Delete board

/**
 * INVITE LINK MANAGEMENT
 */

// POST /api/boards/:id/invite - Generate shareable invite link for a board
router.post('/:id/invite', generateInviteLink);

/**
 * COLLABORATOR MANAGEMENT
 */

// POST /api/boards/:id/collaborators - Add a new collaborator to the board
router.post('/:id/collaborators', addCollaborator);

// DELETE /api/boards/:id/collaborators/:userId - Remove a collaborator from the board
router.delete('/:id/collaborators/:userId', removeCollaborator);

// Export the router to be used in server.js
module.exports = router;
