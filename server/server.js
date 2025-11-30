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

// Function to get local IP address
const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
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
  "https://colabcanvas.vercel.app",
  "https://colabcanvas-c81bl9alj-jainkartikeya9-gmailcoms-projects.vercel.app"
].filter(Boolean);

// CORS origin checker function to allow all Vercel preview URLs
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin matches Vercel preview URL pattern
    if (origin.match(/https:\/\/colabcanvas.*\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors(corsOptions));
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
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Store the client URL globally for use in controllers
// In production, use environment variable, otherwise use local IP
if (process.env.NODE_ENV === 'production' && process.env.CLIENT_URL) {
  global.CLIENT_URL = process.env.CLIENT_URL;
} else {
  global.CLIENT_URL = `http://${LOCAL_IP}:${CLIENT_PORT}`;
}

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
