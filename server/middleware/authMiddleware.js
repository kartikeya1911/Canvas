// Import jsonwebtoken library for JWT verification
const jwt = require('jsonwebtoken');
// Import User model to fetch user data
const User = require('../models/User');

/**
 * PROTECT MIDDLEWARE - Verify JWT Token for Authentication
 * This middleware ensures the user is logged in before accessing protected routes
 * It extracts and verifies the JWT token from the Authorization header
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = async (req, res, next) => {
  let token;

  // LOG: Check if Authorization header is present
  console.log('🔒 Auth middleware - Headers:', req.headers.authorization ? 'Present' : 'Missing');

  // CHECK: Verify if Authorization header exists and starts with 'Bearer'
  // Format should be: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // EXTRACT: Get token from header by splitting "Bearer token" string
      token = req.headers.authorization.split(' ')[1]; // Get the second part (token)
      console.log('🔑 Token extracted, length:', token.length);

      // VERIFY: Decode and verify the JWT token using secret key
      // This ensures the token hasn't been tampered with and is still valid
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      console.log('✅ Token verified for user:', decoded.id);

      // FETCH: Get user from database using the ID stored in token
      // Exclude password from the result for security
      req.user = await User.findById(decoded.id).select('-password');

      // CHECK: Verify user still exists in database
      if (!req.user) {
        console.log('❌ User not found for ID:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }

      // SUCCESS: User authenticated, log and proceed to next middleware/route
      console.log('👤 User authenticated:', req.user.name, req.user.email);
      next(); // Continue to the actual route handler
    } catch (error) {
      // ERROR: Token verification failed (expired, invalid, or tampered)
      console.error('❌ Token verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    // ERROR: No token provided in request
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * OPTIONAL AUTH MIDDLEWARE - Verify JWT Token but Don't Require It
 * This middleware checks for authentication but allows access even if no token is provided
 * Used for routes that work for both authenticated and anonymous users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuth = async (req, res, next) => {
  let token;

  // LOG: Check if Authorization header is present
  console.log('🔓 Optional auth middleware - Headers:', req.headers.authorization ? 'Present' : 'Missing');

  // CHECK: If Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // EXTRACT: Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('🔑 Optional token extracted, length:', token.length);

      // VERIFY: Decode and verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      console.log('✅ Optional token verified for user:', decoded.id);

      // FETCH: Get user from database
      req.user = await User.findById(decoded.id).select('-password');

      // LOG: If user found, log authentication success
      if (req.user) {
        console.log('👤 Optional user authenticated:', req.user.name, req.user.email);
      }
    } catch (error) {
      // INFO: Token verification failed but continue anyway (it's optional)
      console.log('⚠️ Optional token verification failed (continuing anyway):', error.message);
      req.user = null; // Set user to null if token is invalid
    }
  } else {
    // INFO: No token provided, continue as anonymous user
    console.log('ℹ️ No token provided for optional auth (continuing anyway)');
    req.user = null; // Set user to null for anonymous access
  }

  // CONTINUE: Proceed to next middleware/route regardless of authentication status
  next();
};

/**
 * SOCKET.IO AUTHENTICATION MIDDLEWARE
 * This middleware verifies JWT token for WebSocket connections
 * Used to authenticate users connecting via Socket.IO for real-time features
 * ALLOWS ANONYMOUS ACCESS for shared boards
 * 
 * @param {Object} socket - Socket.IO socket object
 * @param {Function} next - Socket.IO next function
 */
const socketAuth = async (socket, next) => {
  try {
    // EXTRACT: Get token from socket handshake (connection initialization)
    // Token can be in auth object or Authorization header
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(' ')[1];
    
    // CHECK: If token is provided, verify it
    if (token) {
      try {
        // VERIFY: Decode and verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        
        // FETCH: Get user from database
        const user = await User.findById(decoded.id).select('-password');
        
        // CHECK: Verify user exists
        if (user) {
          // SUCCESS: Attach user to socket object for use in socket event handlers
          socket.user = user;
          console.log('✅ Socket authenticated for user:', user.name);
        } else {
          // User not found, continue as anonymous
          console.log('⚠️ User not found for token, continuing as anonymous');
          socket.user = { _id: 'anonymous', name: 'Anonymous User', email: '' };
        }
      } catch (error) {
        // Token invalid, continue as anonymous
        console.log('⚠️ Invalid token for socket, continuing as anonymous:', error.message);
        socket.user = { _id: 'anonymous', name: 'Anonymous User', email: '' };
      }
    } else {
      // NO TOKEN: Allow anonymous access for shared boards
      console.log('ℹ️ No token provided, allowing anonymous socket connection');
      socket.user = { _id: 'anonymous', name: 'Anonymous User', email: '' };
    }

    // CONTINUE: Allow WebSocket connection (authenticated or anonymous)
    next();
  } catch (error) {
    // ERROR: Unexpected error, still allow connection as anonymous
    console.error('Socket authentication error, continuing as anonymous:', error);
    socket.user = { _id: 'anonymous', name: 'Anonymous User', email: '' };
    next();
  }
};

// EXPORT: Make middleware functions available to routes
module.exports = { 
  protect,      // Require authentication (HTTP routes)
  socketAuth,   // Allow anonymous authentication (Socket.IO)
  optionalAuth  // Optional authentication (works for both authenticated and anonymous)
};
