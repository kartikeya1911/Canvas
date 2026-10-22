const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  `http://${LOCAL_IP}:${CLIENT_PORT}`,
  process.env.CLIENT_URL,
  "https://collab-canvas-lovat.vercel.app"
].filter(Boolean);

// CORS origin checker
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow all Vercel preview deployment URLs
    if (origin.match(/https:\/\/.*\.vercel\.app$/)) return callback(null, true);
    // Allow localhost and loopback on any port
    if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) return callback(null, true);
    // Allow local network IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (origin.match(/^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/)) return callback(null, true);
    
    // Safely deny without throwing 500
    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6 // 1 MB max message size
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors(corsOptions));

// Body parser with size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// Express 5 compatible NoSQL injection sanitization
const sanitizeNoSQL = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeNoSQL(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeNoSQL(req.body);
  if (req.params) sanitizeNoSQL(req.params);
  if (req.query) sanitizeNoSQL(req.query);
  next();
});

// Global rate limiter (100 req/15min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again in 15 minutes.' }
});

// Mount routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/boards', boardRoutes);

// Initialize Socket.IO whiteboard events
whiteboardEvents(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ColabCanvas server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — prevents stack traces leaking to client
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const status = err.status || (err.message?.includes('CORS') ? 403 : 500);
  console.error('Unhandled error:', err.message);
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

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
