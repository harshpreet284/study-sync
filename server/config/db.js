import mongoose from 'mongoose';

/**
 * Connect to MongoDB using the MONGODB_URI environment variable.
 * Handles connection errors gracefully without crashing the server process.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[Database] MONGODB_URI is not defined. Running without persistent database connection.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB connection failed: ${error.message}`);
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('[Database] MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database] MongoDB connection error: ${err.message}`);
});

/**
 * Disconnect from MongoDB cleanly if connected or connecting.
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close(false);
      console.log('[Database] MongoDB connection closed.');
    } catch (error) {
      console.error(`[Database] Error closing MongoDB connection: ${error.message}`);
    }
  }
};
