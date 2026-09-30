const mongoose = require('mongoose');

// Fallback MongoDB Atlas connection string for Vercel / Cloud deployments
const DEFAULT_MONGODB_URI = 'mongodb+srv://rexbiswas1_db_user:8PK4spFkxITFZ2RV@cluster0.i12d4hd.mongodb.net/drinko?retryWrites=true&w=majority';

// Global cache for serverless environments (prevents opening new connection on every function invocation)
let cached = global._drinkoMongoose;
if (!cached) {
  cached = global._drinkoMongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Re-use existing open Mongoose connection if active
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const isVercel = Boolean(process.env.VERCEL);
    const mongoURI = (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim();

    // Disable command buffering globally so queries fail immediately if connection is down
    // instead of hanging for 10,000ms with 'buffering timed out'
    mongoose.set('strictQuery', true);
    mongoose.set('bufferCommands', false);

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
      socketTimeoutMS: 20000
    };

    console.log(`[Drinko DB] Connecting to MongoDB (Vercel: ${isVercel})...`);

    cached.promise = mongoose.connect(mongoURI, opts)
      .then((mongooseInstance) => {
        console.log(`[Drinko DB] Connected to MongoDB: ${mongooseInstance.connection.host}`);
        cached.conn = mongooseInstance.connection;
        return cached.conn;
      })
      .catch(async (primaryErr) => {
        cached.promise = null;
        cached.conn = null;
        console.warn(`[Drinko DB] MongoDB Atlas connection failed (${primaryErr.message}).`);

        if (isVercel) {
          throw new Error(
            `MongoDB connection failed: ${primaryErr.message}. Ensure your MongoDB Atlas Network Access has 0.0.0.0/0 (Allow access from anywhere) whitelisted, and MONGODB_URI is added in Vercel Project Settings.`
          );
        }

        // Local Development Fallback: In-memory MongoDB
        try {
          console.log('[Drinko DB] Starting in-memory MongoDB server for local development...');
          const path = require('path');
          const fs = require('fs');
          const dataDir = path.join(__dirname, '../../.mongo_data');
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }

          const memServerModule = 'mongodb-memory-server';
          const { MongoMemoryServer } = require(memServerModule);
          const mongod = await MongoMemoryServer.create({
            instance: {
              dbPath: dataDir,
              storageEngine: 'wiredTiger'
            }
          });
          const memUri = mongod.getUri();
          const memConn = await mongoose.connect(memUri, { bufferCommands: false });
          console.log(`[Drinko DB] Connected to In-Memory MongoDB at: ${memUri}`);
          cached.conn = memConn.connection;
          return cached.conn;
        } catch (memErr) {
          console.error('[Drinko DB] Failed to start in-memory MongoDB:', memErr.message);
          throw primaryErr;
        }
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error('[Drinko DB] Connection Error:', error.message);
    throw error;
  }
};

module.exports = connectDB;

