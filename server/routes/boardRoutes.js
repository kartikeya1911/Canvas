const express = require('express');
const {
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
} = require('../controllers/boardController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Board API is working', user: req.user || 'Not authenticated' });
});

// Public routes with optional authentication
router.get('/invite/:boardId', optionalAuth, getBoardByInvite); // Get board info by invite
router.post('/join/:boardId', optionalAuth, joinBoardViaInvite); // Join board via invite

// Protected routes (authentication required)
router.use(protect);

// Board CRUD operations
router.route('/')
  .get(getBoards)
  .post(createBoard);

router.route('/:id')
  .get(getBoard)
  .put(updateBoard)
  .delete(deleteBoard);

// Invite link management
router.post('/:id/invite', generateInviteLink); // Generate invite link

// Collaborator management
router.post('/:id/collaborators', addCollaborator);
router.delete('/:id/collaborators/:userId', removeCollaborator);

module.exports = router;
