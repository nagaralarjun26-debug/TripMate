// server/config/db.js
// MongoDB connection helper using Mongoose

const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the MONGO_URI from environment variables.
 * Exits process with failure code (1) if connection fails.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tripmate';
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`[MongoDB] Connected successfully to ${mongoUri}`);
    console.log(`[MongoDB] Host: ${conn.connection.host}, Port: ${conn.connection.port}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error('Ensure MongoDB service is running and accessible.');
    process.exit(1);
  }
};

module.exports = connectDB;
