const express = require('express');
const {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  addCollaborator,
  removeCollaborator
} = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Board CRUD operations
router.route('/')
  .get(getBoards)
  .post(createBoard);

router.route('/:id')
  .get(getBoard)
  .put(updateBoard)
  .delete(deleteBoard);

// Collaborator management
router.post('/:id/collaborators', addCollaborator);
router.delete('/:id/collaborators/:userId', removeCollaborator);

module.exports = router;
