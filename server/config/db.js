// Import mongoose library for MongoDB object modeling
const mongoose = require('mongoose');

/**
 * Function to establish connection with MongoDB database
 * This is an asynchronous function that connects to MongoDB using connection string
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using connection string from environment variable
    // Falls back to local MongoDB if MONGODB_URI is not set
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/colabcanvas'
    );
    
    // Log successful connection with the database host information
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log error if connection fails
    console.error('❌ Error connecting to MongoDB:', error.message);
    
    // Exit the application with failure code if database connection fails
    // This prevents the server from running without a database connection
    process.exit(1);
  }
};

// Export the connectDB function to be used in server.js
module.exports = connectDB;
