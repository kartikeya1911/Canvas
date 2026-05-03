const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const os = require('os');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const whiteboardEvents = require('./socketHandlers/whiteboardEvents');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const LOCAL_IP = getLocalIPAddress();
const CLIENT_PORT = 3000;

// Socket.IO setup with CORS - allow both localhost, network IP, and Vercel
const allowedOrigins = [
  "http://localhost:3000",
  `http://${LOCAL_IP}:${CLIENT_PORT}`,
  process.env.CLIENT_URL,
  "https://collab-canvas-lovat.vercel.app"
].filter(Boolean);

// CORS origin checker function to allow all Vercel preview URLs
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 CORS Request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ No origin - allowing');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin in allowed list');
      return callback(null, true);
    }
    
    // Check if origin matches any Vercel deployment URL pattern
    if (origin.match(/https:\/\/.*\.vercel\.app$/)) {
      console.log('✅ Vercel deployment URL - allowing');
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.match(/^http:\/\/localhost(:\d+)?$/)) {
      console.log('✅ Localhost - allowing');
      return callback(null, true);
    }
    
    console.log('❌ Origin not allowed:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Connect to MongoDB database
// This establishes connection to MongoDB for data persistence
connectDB();

app.use(cors(corsOptions));
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

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// In production/cloud: CLIENT_URL env var is set by hosting platform (e.g. Render)
// In local dev without CLIENT_URL set: fall back to localhost (never the auto-detected LAN IP)
global.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

server.listen(PORT, HOST, () => {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         🎨 ColabCanvas Server Started Successfully       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`📍 Local IP Address: ${LOCAL_IP}`);
  console.log(`\n📱 Access URLs:`);
  console.log(`   • Local:    http://localhost:${PORT}`);
  console.log(`   • Network:  http://${LOCAL_IP}:${PORT}`);
  console.log(`\n🌐 Frontend URLs:`);
  console.log(`   • Local:    http://localhost:${CLIENT_PORT}`);
  console.log(`   • Network:  http://${LOCAL_IP}:${CLIENT_PORT}`);
  console.log(`\n📡 Socket.IO ready for real-time collaboration`);
  console.log(`🔗 Share links will use: ${global.CLIENT_URL}`);
  console.log('\n✅ Ready to accept connections!\n');
});

module.exports = { app, server, io };
