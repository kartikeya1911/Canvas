const mongoose = require('mongoose');

/**
 * Connect to MongoDB (Atlas or Local) with production resiliency & retry logic
 */
const connectDB = async (retryCount = 0) => {
  const maxRetries = 5;
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/colabcanvas';

  if (mongoURI.includes('<db_password>')) {
    console.warn('\n⚠️  WARNING: Your MONGODB_URI still contains "<db_password>".');
    console.warn('👉 Please replace "<db_password>" with your actual MongoDB Atlas password in server/.env or your deployment environment variables.\n');
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection attempt ${retryCount + 1} failed:`, error.message);
    if (retryCount < maxRetries) {
      const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.log(`⏳ Retrying MongoDB connection in ${waitTime / 1000}s...`);
      setTimeout(() => connectDB(retryCount + 1), waitTime);
    } else {
      console.error('❌ Failed to connect to MongoDB after multiple attempts.');
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

module.exports = connectDB;
