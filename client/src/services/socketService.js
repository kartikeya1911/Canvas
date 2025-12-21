import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentBoard = null;
    this.eventListeners = new Map();
  }

  connect(token) {
    // Prevent multiple connections with the same token (or no token)
    if (this.socket?.connected && this.socket.auth?.token === token) {
      console.log('🔌 Already connected with the same token');
      return this.socket;
    }

    // Disconnect any existing connection first
    if (this.socket) {
      this.disconnect();
    }

    const serverUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    console.log('🔌 Connecting to server...', token ? 'with authentication' : 'anonymously');
    
    // Create socket connection with or without token
    const socketOptions = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    };
    
    // Only add auth if token exists
    if (token) {
      socketOptions.auth = { token };
    }
    
    this.socket = io(serverUrl, socketOptions);

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.isConnected = false;
      this.currentBoard = null;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });

    return this.socket;
  }

  get connected() {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentBoard = null;
      this.eventListeners.clear();
    }
  }

  // Board management
  joinBoard(boardId) {
    if (this.socket && boardId && this.currentBoard !== boardId) {
      // Leave current board if different
      if (this.currentBoard) {
        this.leaveBoard();
      }
      
      this.currentBoard = boardId;
      this.socket.emit('join-board', boardId);
      console.log(`🏠 Joining board: ${boardId}`);
    }
  }

  leaveBoard() {
    if (this.socket && this.currentBoard) {
      console.log(`🚪 Leaving board: ${this.currentBoard}`);
      this.socket.emit('leave-board', this.currentBoard);
      this.currentBoard = null;
    }
  }

  // Drawing events
  emitDrawing(data) {
    if (this.socket && this.currentBoard) {
      this.socket.emit('drawing', data);
    }
  }

  emitLineDraw(data) {
    if (this.socket && this.currentBoard) {
      this.socket.emit('line-draw', data);
    }
  }

  emitRectDraw(data) {
    if (this.socket && this.currentBoard) {
      this.socket.emit('rect-draw', data);
    }
  }

  emitCircleDraw(data) {
    if (this.socket && this.currentBoard) {
      this.socket.emit('circle-draw', data);
    }
  }

  emitArrowDraw(data) {
    if (this.socket && this.currentBoard) {
      this.socket.emit('arrow-draw', data);
    }
  }

  emitTextAdd(data) {
    if (this.socket && this.currentBoard) {
      this.socket.emit('text-add', data);
    }
  }

  emitCursorMove(data) {
    if (this.socket && this.currentBoard) {
      this.socket.emit('cursor-move', data);
    }
  }

  emitElementDelete(data) {
    if (this.socket && this.currentBoard) {
      this.socket.emit('element-delete', data);
    }
  }

  emitShapeUpdate(data) {
    if (this.socket && this.currentBoard) {
      this.socket.emit('shape-update', data);
    }
  }

  emitBoardClear() {
    if (this.socket && this.currentBoard) {
      this.socket.emit('board-clear');
    }
  }

  emitUndo() {
    if (this.socket && this.currentBoard) {
      this.socket.emit('undo');
    }
  }

  emitRedo() {
    if (this.socket && this.currentBoard) {
      this.socket.emit('redo');
    }
  }

  // Chat
  emitChatMessage(message) {
    if (this.socket && this.currentBoard && message.trim()) {
      this.socket.emit('chat-message', { message: message.trim() });
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store callback for cleanup
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored callbacks
      if (this.eventListeners.has(event)) {
        const callbacks = this.eventListeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.eventListeners.delete(event);
    }
  }

  // Cleanup all listeners
  cleanup() {
    if (this.socket) {
      for (const [event, callbacks] of this.eventListeners) {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      }
      this.eventListeners.clear();
    }
  }

  // Getters
  get boardId() {
    return this.currentBoard;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
