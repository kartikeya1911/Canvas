const Board = require('../models/Board');
const mongoose = require('mongoose');
const { socketAuth } = require('../middleware/authMiddleware');

/**
 * Helper: find a board by room ID (which may be a UUID or MongoDB ObjectId)
 * This resolves the bug where handlers used Board.findById() with a UUID string.
 */
async function findBoardByRoomId(roomId) {
  if (!roomId) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(roomId) && /^[0-9a-fA-F]{24}$/.test(roomId);
  if (isObjectId) {
    return await Board.findById(roomId);
  }
  // UUID or any other string — search by boardId field
  return await Board.findOne({ boardId: roomId });
}

const whiteboardEvents = (io) => {
  // Authentication middleware for socket connections
  io.use(socketAuth);

  // Store active users per board
  const boardUsers = new Map();
  const userCursors = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.user.name} connected: ${socket.id}`);

    // Join a board room
    socket.on('join-board', async (boardId) => {
      try {
        console.log('🔗 User attempting to join board:', boardId);

        let board;

        // Check if it's a MongoDB ObjectId or UUID
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(boardId);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(boardId);

        if (isObjectId) {
          console.log('📌 Searching by MongoDB ObjectId');
          board = await Board.findById(boardId);
        } else if (isUUID) {
          console.log('🔗 Searching by boardId (UUID)');
          board = await Board.findOne({ boardId: boardId });
        } else {
          console.log('❌ Invalid board ID format');
          socket.emit('error', { message: 'Invalid board ID format' });
          return;
        }

        if (!board) {
          console.log('❌ Board not found');
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        console.log('✅ Board found:', board.title);

        const hasAccess = board.owner.toString() === socket.user._id.toString() ||
                         board.collaborators.some(collab => collab.user && collab.user.toString() === socket.user._id.toString()) ||
                         board.isPublic ||
                         board.allowAnonymous;

        if (!hasAccess) {
          console.log('🚫 Access denied for user:', socket.user.name);
          socket.emit('error', { message: 'Access denied to this board' });
          return;
        }

        // Use consistent room identifier (prefer UUID boardId over MongoDB _id)
        const roomId = board.boardId || boardId;

        // Leave previous board if any
        if (socket.currentBoard) {
          socket.leave(socket.currentBoard);
          removeUserFromBoard(socket.currentBoard, socket.id);
        }

        // Join new board using consistent room ID
        socket.join(roomId);
        socket.currentBoard = roomId;
        console.log(`🚪 User ${socket.user.name} joining room: ${roomId}`);

        // Add user to board users map
        if (!boardUsers.has(roomId)) {
          boardUsers.set(roomId, new Map());
        }
        boardUsers.get(roomId).set(socket.id, {
          id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email,
          joinedAt: new Date()
        });

        // Send current board state to the joining user
        socket.emit('board-state', {
          board: board.data,
          users: Array.from(boardUsers.get(roomId).values())
        });

        // Notify other users in the board
        socket.to(roomId).emit('user-joined', {
          user: {
            id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email
          }
        });

        // Send updated user list to all users in the board
        const currentUsers = Array.from(boardUsers.get(roomId).values());
        io.to(roomId).emit('users-update', currentUsers);
        console.log(`👥 Users in board ${roomId}:`, currentUsers.map(u => u.name));
        console.log(`👤 User ${socket.user.name} joined board ${roomId}`);
      } catch (error) {
        console.error('Join board error:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Handle freehand drawing events (broadcast only, no persistence needed for strokes in-progress)
    socket.on('drawing', (data) => {
      if (socket.currentBoard) {
        socket.to(socket.currentBoard).emit('drawing', {
          ...data,
          userId: socket.user._id,
          userName: socket.user.name,
          timestamp: new Date()
        });
      }
    });

    // Handle line drawing (persist + broadcast)
    socket.on('line-draw', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await findBoardByRoomId(socket.currentBoard);
          if (board) {
            if (!board.data.lines) board.data.lines = [];
            board.data.lines.push({
              ...data,
              id: data.id || `line_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            board.markModified('data');
            await board.save();
            console.log(`✏️ Line drawn on board ${socket.currentBoard} by ${socket.user.name}`);
          }

          socket.to(socket.currentBoard).emit('line-draw', {
            ...data,
            userId: socket.user._id,
            userName: socket.user.name
          });
        } catch (error) {
          console.error('Line draw error:', error);
        }
      }
    });

    // Handle rectangle drawing (persist + broadcast)
    socket.on('rect-draw', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await findBoardByRoomId(socket.currentBoard);
          if (board) {
            if (!board.data.rectangles) board.data.rectangles = [];
            board.data.rectangles.push({
              ...data,
              id: data.id || `rect_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            board.markModified('data');
            await board.save();
            console.log(`📐 Rectangle drawn on board ${socket.currentBoard} by ${socket.user.name}`);
          }

          socket.to(socket.currentBoard).emit('rect-draw', {
            ...data,
            userId: socket.user._id,
            userName: socket.user.name
          });
        } catch (error) {
          console.error('Rectangle draw error:', error);
        }
      }
    });

    // Handle circle drawing (persist + broadcast) — FIXED: was using findById with UUID
    socket.on('circle-draw', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await findBoardByRoomId(socket.currentBoard);
          if (board) {
            if (!board.data.circles) board.data.circles = [];
            board.data.circles.push({
              ...data,
              id: data.id || `circle_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            board.markModified('data');
            await board.save();
            console.log(`⭕ Circle drawn on board ${socket.currentBoard} by ${socket.user.name}`);
          }

          socket.to(socket.currentBoard).emit('circle-draw', {
            ...data,
            userId: socket.user._id,
            userName: socket.user.name
          });
        } catch (error) {
          console.error('Circle draw error:', error);
        }
      }
    });

    // Handle arrow drawing (persist + broadcast) — FIXED: was using findById with UUID
    socket.on('arrow-draw', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await findBoardByRoomId(socket.currentBoard);
          if (board) {
            if (!board.data.arrows) board.data.arrows = [];
            board.data.arrows.push({
              ...data,
              id: data.id || `arrow_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            board.markModified('data');
            await board.save();
            console.log(`➡️ Arrow drawn on board ${socket.currentBoard} by ${socket.user.name}`);
          }

          socket.to(socket.currentBoard).emit('arrow-draw', {
            ...data,
            userId: socket.user._id,
            userName: socket.user.name
          });
        } catch (error) {
          console.error('Arrow draw error:', error);
        }
      }
    });

    // Handle text creation (persist + broadcast) — FIXED: was using findById with UUID
    socket.on('text-add', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await findBoardByRoomId(socket.currentBoard);
          if (board) {
            if (!board.data.textNodes) board.data.textNodes = [];
            board.data.textNodes.push({
              ...data,
              id: data.id || `text_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            board.markModified('data');
            await board.save();
            console.log(`📝 Text added on board ${socket.currentBoard} by ${socket.user.name}`);
          }

          socket.to(socket.currentBoard).emit('text-add', {
            ...data,
            userId: socket.user._id,
            userName: socket.user.name
          });
        } catch (error) {
          console.error('Text add error:', error);
        }
      }
    });

    // Handle shape update (move/resize) — ADDED: was missing from server
    socket.on('shape-update', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await findBoardByRoomId(socket.currentBoard);
          if (board && data.elementId && data.elementType) {
            const updateElementInArray = (arr) => {
              if (!arr) return arr;
              return arr.map(el => el.id === data.elementId ? { ...el, ...data, timestamp: new Date() } : el);
            };

            if (data.elementType === 'line') board.data.lines = updateElementInArray(board.data.lines);
            else if (data.elementType === 'rectangle') board.data.rectangles = updateElementInArray(board.data.rectangles);
            else if (data.elementType === 'circle') board.data.circles = updateElementInArray(board.data.circles);
            else if (data.elementType === 'arrow') board.data.arrows = updateElementInArray(board.data.arrows);
            else if (data.elementType === 'text') board.data.textNodes = updateElementInArray(board.data.textNodes);

            board.markModified('data');
            await board.save();
          }

          socket.to(socket.currentBoard).emit('shape-update', {
            ...data,
            userId: socket.user._id,
            userName: socket.user.name
          });
        } catch (error) {
          console.error('Shape update error:', error);
        }
      }
    });

    // Handle cursor movement (broadcast only, no persistence)
    socket.on('cursor-move', (data) => {
      if (socket.currentBoard) {
        userCursors.set(socket.id, {
          userId: socket.user._id,
          userName: socket.user.name,
          x: data.x,
          y: data.y,
          timestamp: Date.now()
        });

        socket.to(socket.currentBoard).emit('cursor-move', {
          userId: socket.user._id,
          userName: socket.user.name,
          x: data.x,
          y: data.y
        });
      }
    });

    // Handle element deletion (persist + broadcast) — FIXED: was using findById with UUID; also added circle/arrow deletion
    socket.on('element-delete', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await findBoardByRoomId(socket.currentBoard);
          if (board && data.elementId && data.elementType) {
            if (data.elementType === 'line' && board.data.lines) {
              board.data.lines = board.data.lines.filter(line => line.id !== data.elementId);
            } else if (data.elementType === 'rectangle' && board.data.rectangles) {
              board.data.rectangles = board.data.rectangles.filter(rect => rect.id !== data.elementId);
            } else if (data.elementType === 'circle' && board.data.circles) {
              board.data.circles = board.data.circles.filter(c => c.id !== data.elementId);
            } else if (data.elementType === 'arrow' && board.data.arrows) {
              board.data.arrows = board.data.arrows.filter(a => a.id !== data.elementId);
            } else if (data.elementType === 'text' && board.data.textNodes) {
              board.data.textNodes = board.data.textNodes.filter(text => text.id !== data.elementId);
            }
            board.markModified('data');
            await board.save();
            console.log(`🗑️ Element deleted on board ${socket.currentBoard} by ${socket.user.name}`);
          }

          socket.to(socket.currentBoard).emit('element-delete', {
            ...data,
            userId: socket.user._id,
            userName: socket.user.name
          });
        } catch (error) {
          console.error('Element delete error:', error);
        }
      }
    });

    // Handle board clear (persist + broadcast) — FIXED: was using findById with UUID
    socket.on('board-clear', async () => {
      if (socket.currentBoard) {
        try {
          const board = await findBoardByRoomId(socket.currentBoard);
          if (board) {
            board.data = {
              lines: [],
              rectangles: [],
              textNodes: [],
              circles: [],
              arrows: [],
              stickyNotes: [],
              background: board.data.background || '#ffffff',
              gridEnabled: board.data.gridEnabled || false
            };
            board.markModified('data');
            await board.save();
            console.log(`🧹 Board ${socket.currentBoard} cleared by ${socket.user.name}`);
          }

          io.to(socket.currentBoard).emit('board-clear', {
            userId: socket.user._id,
            userName: socket.user.name
          });
        } catch (error) {
          console.error('Board clear error:', error);
        }
      }
    });

    // Handle undo (broadcast only — client manages undo state locally)
    socket.on('undo', () => {
      if (socket.currentBoard) {
        socket.to(socket.currentBoard).emit('undo', {
          userId: socket.user._id,
          userName: socket.user.name
        });
      }
    });

    // Handle redo (broadcast only)
    socket.on('redo', () => {
      if (socket.currentBoard) {
        socket.to(socket.currentBoard).emit('redo', {
          userId: socket.user._id,
          userName: socket.user.name
        });
      }
    });

    // Handle chat messages (broadcast to all in room including sender)
    socket.on('chat-message', (data) => {
      if (socket.currentBoard && data.message && data.message.trim()) {
        const messageData = {
          id: `msg_${Date.now()}_${Math.random()}`,
          message: data.message.trim(),
          userId: socket.user._id,
          userName: socket.user.name,
          timestamp: new Date()
        };

        io.to(socket.currentBoard).emit('chat-message', messageData);
      }
    });

    // Handle leaving board explicitly
    socket.on('leave-board', () => {
      if (socket.currentBoard) {
        console.log(`🚪 User ${socket.user.name} leaving board ${socket.currentBoard}`);

        removeUserFromBoard(socket.currentBoard, socket.id);

        socket.to(socket.currentBoard).emit('user-left', {
          user: {
            id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email
          }
        });

        if (boardUsers.has(socket.currentBoard)) {
          io.to(socket.currentBoard).emit('users-update',
            Array.from(boardUsers.get(socket.currentBoard).values())
          );
        }

        socket.leave(socket.currentBoard);
        socket.currentBoard = null;
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.user.name} disconnected: ${socket.id}`);

      if (socket.currentBoard) {
        removeUserFromBoard(socket.currentBoard, socket.id);

        socket.to(socket.currentBoard).emit('user-left', {
          user: {
            id: socket.user._id,
            name: socket.user.name
          }
        });

        if (boardUsers.has(socket.currentBoard)) {
          io.to(socket.currentBoard).emit('users-update',
            Array.from(boardUsers.get(socket.currentBoard).values())
          );
        }
      }

      userCursors.delete(socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Helper function to remove user from board
  function removeUserFromBoard(boardId, socketId) {
    if (boardUsers.has(boardId)) {
      boardUsers.get(boardId).delete(socketId);
      if (boardUsers.get(boardId).size === 0) {
        boardUsers.delete(boardId);
      }
    }
  }

  // Clean up inactive cursors periodically (every 30s)
  setInterval(() => {
    const now = Date.now();
    for (const [socketId, cursor] of userCursors.entries()) {
      if (now - cursor.timestamp > 30000) {
        userCursors.delete(socketId);
      }
    }
  }, 30000);
};

module.exports = whiteboardEvents;
