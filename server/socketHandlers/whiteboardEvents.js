const Board = require('../models/Board');
const { socketAuth } = require('../middleware/authMiddleware');

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
                         board.collaborators.some(collab => collab.user.toString() === socket.user._id.toString()) ||
                         board.isPublic;

        if (!hasAccess) {
          console.log('🚫 Access denied for user:', socket.user.name);
          socket.emit('error', { message: 'Access denied to this board' });
          return;
        }

        // Leave previous board if any
        if (socket.currentBoard) {
          socket.leave(socket.currentBoard);
          removeUserFromBoard(socket.currentBoard, socket.id);
        }

        // Join new board
        socket.join(boardId);
        socket.currentBoard = boardId;

        // Add user to board users
        if (!boardUsers.has(boardId)) {
          boardUsers.set(boardId, new Map());
        }
        boardUsers.get(boardId).set(socket.id, {
          id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email,
          joinedAt: new Date()
        });

        // Send current board state to the joining user
        socket.emit('board-state', {
          board: board.data,
          users: Array.from(boardUsers.get(boardId).values())
        });

        // Notify other users in the board
        socket.to(boardId).emit('user-joined', {
          user: {
            id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email
          }
        });

        // Send updated user list to all users in the board
        io.to(boardId).emit('users-update', Array.from(boardUsers.get(boardId).values()));

        console.log(`👤 User ${socket.user.name} joined board ${boardId}`);
      } catch (error) {
        console.error('Join board error:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Handle drawing events
    socket.on('drawing', (data) => {
      if (socket.currentBoard) {
        // Broadcast to all other users in the board
        socket.to(socket.currentBoard).emit('drawing', {
          ...data,
          userId: socket.user._id,
          userName: socket.user.name,
          timestamp: new Date()
        });
      }
    });

    // Handle line drawing
    socket.on('line-draw', async (data) => {
      if (socket.currentBoard) {
        try {
          // Update board in database
          const board = await Board.findById(socket.currentBoard);
          if (board) {
            if (!board.data.lines) board.data.lines = [];
            board.data.lines.push({
              ...data,
              id: data.id || `line_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            await board.save();
          }

          // Broadcast to other users
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

    // Handle rectangle drawing
    socket.on('rect-draw', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await Board.findById(socket.currentBoard);
          if (board) {
            if (!board.data.rectangles) board.data.rectangles = [];
            board.data.rectangles.push({
              ...data,
              id: data.id || `rect_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            await board.save();
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

    // Handle circle drawing
    socket.on('circle-draw', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await Board.findById(socket.currentBoard);
          if (board) {
            if (!board.data.circles) board.data.circles = [];
            board.data.circles.push({
              ...data,
              id: data.id || `circle_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            await board.save();
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

    // Handle arrow drawing
    socket.on('arrow-draw', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await Board.findById(socket.currentBoard);
          if (board) {
            if (!board.data.arrows) board.data.arrows = [];
            board.data.arrows.push({
              ...data,
              id: data.id || `arrow_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            await board.save();
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

    // Handle text creation
    socket.on('text-add', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await Board.findById(socket.currentBoard);
          if (board) {
            if (!board.data.textNodes) board.data.textNodes = [];
            board.data.textNodes.push({
              ...data,
              id: data.id || `text_${Date.now()}_${Math.random()}`,
              timestamp: new Date()
            });
            await board.save();
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

    // Handle cursor movement
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

    // Handle element deletion
    socket.on('element-delete', async (data) => {
      if (socket.currentBoard) {
        try {
          const board = await Board.findById(socket.currentBoard);
          if (board && data.elementId && data.elementType) {
            // Remove element from appropriate array
            if (data.elementType === 'line' && board.data.lines) {
              board.data.lines = board.data.lines.filter(line => line.id !== data.elementId);
            } else if (data.elementType === 'rectangle' && board.data.rectangles) {
              board.data.rectangles = board.data.rectangles.filter(rect => rect.id !== data.elementId);
            } else if (data.elementType === 'text' && board.data.textNodes) {
              board.data.textNodes = board.data.textNodes.filter(text => text.id !== data.elementId);
            }
            await board.save();
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

    // Handle board clear
    socket.on('board-clear', async () => {
      if (socket.currentBoard) {
        try {
          const board = await Board.findById(socket.currentBoard);
          if (board) {
            board.data = {
              lines: [],
              rectangles: [],
              textNodes: [],
              circles: [],
              arrows: []
            };
            await board.save();
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

    // Handle undo/redo
    socket.on('undo', () => {
      if (socket.currentBoard) {
        socket.to(socket.currentBoard).emit('undo', {
          userId: socket.user._id,
          userName: socket.user.name
        });
      }
    });

    socket.on('redo', () => {
      if (socket.currentBoard) {
        socket.to(socket.currentBoard).emit('redo', {
          userId: socket.user._id,
          userName: socket.user.name
        });
      }
    });

    // Handle chat messages
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

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.user.name} disconnected: ${socket.id}`);
      
      if (socket.currentBoard) {
        removeUserFromBoard(socket.currentBoard, socket.id);
        
        // Notify other users
        socket.to(socket.currentBoard).emit('user-left', {
          user: {
            id: socket.user._id,
            name: socket.user.name
          }
        });

        // Send updated user list
        if (boardUsers.has(socket.currentBoard)) {
          io.to(socket.currentBoard).emit('users-update', 
            Array.from(boardUsers.get(socket.currentBoard).values())
          );
        }
      }

      // Remove cursor
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

  // Clean up inactive cursors periodically
  setInterval(() => {
    const now = Date.now();
    for (const [socketId, cursor] of userCursors.entries()) {
      if (now - cursor.timestamp > 30000) { // 30 seconds
        userCursors.delete(socketId);
      }
    }
  }, 30000);
};

module.exports = whiteboardEvents;
