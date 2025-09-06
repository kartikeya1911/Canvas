const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const whiteboardEvents = require('./socketHandlers/whiteboardEvents');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

// Socket.IO event handlers
whiteboardEvents(io);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ColabCanvas server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 ColabCanvas server running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
  console.log(`📡 Socket.IO ready for real-time collaboration`);
});

module.exports = { app, server, io };
