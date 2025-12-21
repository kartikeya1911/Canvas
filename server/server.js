// Import required npm packages for the server
const express = require('express'); // Express.js framework for building the REST API
const http = require('http'); // Node.js HTTP module to create HTTP server
const socketIo = require('socket.io'); // Socket.IO for real-time bidirectional communication
const cors = require('cors'); // CORS middleware to enable cross-origin requests
const connectDB = require('./config/db'); // Database connection configuration
const authRoutes = require('./routes/authRoutes'); // Authentication routes (login, register, etc.)
const boardRoutes = require('./routes/boardRoutes'); // Board routes (create, update, delete boards)
const whiteboardEvents = require('./socketHandlers/whiteboardEvents'); // Real-time whiteboard event handlers
require('dotenv').config(); // Load environment variables from .env file

// Initialize Express application
const app = express();

// Create HTTP server using Express app
// This is needed to integrate Socket.IO with Express
const server = http.createServer(app);

// Configure Socket.IO with CORS settings
// This enables real-time communication between client and server
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow requests from React client
    methods: ["GET", "POST"], // Allowed HTTP methods
    credentials: true // Allow cookies and credentials
  }
});

// Connect to MongoDB database
// This establishes connection to MongoDB for data persistence
connectDB();

// Apply CORS middleware to Express app
// This allows the React frontend to make API requests to the backend
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow requests from React client
  credentials: true // Allow cookies in cross-origin requests
}));

// Parse incoming JSON request bodies
// This middleware makes req.body available in route handlers
app.use(express.json());

// Mount authentication routes at /api/auth
// Handles: /api/auth/register, /api/auth/login, /api/auth/me, etc.
app.use('/api/auth', authRoutes);

// Mount board routes at /api/boards
// Handles: /api/boards (GET, POST), /api/boards/:id (GET, PUT, DELETE), etc.
app.use('/api/boards', boardRoutes);

// Initialize Socket.IO event handlers for real-time collaboration
// This sets up listeners for drawing, cursor movements, user presence, etc.
whiteboardEvents(io);

// Health check endpoint to verify server is running
// Used for monitoring and debugging purposes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', // Server status
    message: 'ColabCanvas server is running', // Confirmation message
    timestamp: new Date().toISOString() // Current server time
  });
});

// Set the port from environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server and listen on the specified port
server.listen(PORT, () => {
  console.log(`🚀 ColabCanvas server running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
  console.log(`📡 Socket.IO ready for real-time collaboration`);
});

// Export server components for testing purposes
module.exports = { app, server, io };
