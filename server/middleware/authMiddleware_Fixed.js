const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  console.log('🔒 Auth middleware - Headers:', req.headers.authorization ? 'Present' : 'Missing');

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('🔑 Token extracted, length:', token.length);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      console.log('✅ Token verified for user:', decoded.id);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.log('❌ User not found for ID:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('👤 User authenticated:', req.user.name, req.user.email);
      next();
    } catch (error) {
      console.error('❌ Token verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Optional authentication middleware for invite routes
const optionalAuth = async (req, res, next) => {
  let token;

  console.log('🔓 Optional auth middleware - Headers:', req.headers.authorization ? 'Present' : 'Missing');

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('🔑 Optional token extracted, length:', token.length);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      console.log('✅ Optional token verified for user:', decoded.id);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (req.user) {
        console.log('👤 Optional user authenticated:', req.user.name, req.user.email);
      }
    } catch (error) {
      console.log('⚠️ Optional token verification failed (continuing anyway):', error.message);
      req.user = null;
    }
  } else {
    console.log('ℹ️ No token provided for optional auth (continuing anyway)');
    req.user = null;
  }

  next();
};

// Socket.IO authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = { protect, socketAuth, optionalAuth };
