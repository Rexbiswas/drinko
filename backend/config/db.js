const mongoose = require('mongoose');

let cachedPromise = null;
let lastFailedAttempt = 0;
const RETRY_COOLDOWN_MS = 15000;

const connectDB = async () => {
  // Re-use existing open Mongoose connection if active
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    try {
      return await cachedPromise;
    } catch (_) {
      cachedPromise = null;
    }
  }

  // On serverless Vercel, avoid blocking subsequent requests if connection failed recently
  if (process.env.VERCEL && Date.now() - lastFailedAttempt < RETRY_COOLDOWN_MS) {
    throw new Error('Database connection temporarily unavailable (cooldown active).');
  }

  try {
    const isVercel = Boolean(process.env.VERCEL);
    const mongoURI = process.env.MONGODB_URI || (!isVercel ? 'mongodb://localhost:27017/drinko' : null);
    
    mongoose.set('strictQuery', true);

    if (!mongoURI && isVercel) {
      console.warn('[Drinko DB] Warning: MONGODB_URI is not set in Vercel environment variables. Please add MONGODB_URI in your Vercel Project Settings > Environment Variables.');
      throw new Error('Database connection string (MONGODB_URI) is not configured in Vercel. Please add MONGODB_URI in your Vercel Project Settings.');
    }
    
    try {
      cachedPromise = mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000
      });
      const conn = await cachedPromise;
      console.log(`[Drinko DB] Connected to MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (primaryErr) {
      cachedPromise = null;
      console.warn(`[Drinko DB] Could not connect to primary MongoDB at ${mongoURI} (${primaryErr.message}).`);
      
      // On Vercel, in-memory MongoDB server cannot run due to serverless read-only restrictions
      if (isVercel) {
        throw new Error(`MongoDB connection failed: ${primaryErr.message}. Verify that MONGODB_URI in Vercel settings has network access (0.0.0.0/0 on Atlas) and valid credentials.`);
      }

      // Local Development Fallback: Use mongodb-memory-server
      try {
        console.log('[Drinko DB] Starting in-memory MongoDB server for development...');
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
        const memConn = await mongoose.connect(memUri);
        console.log(`[Drinko DB] Connected to In-Memory MongoDB at: ${memUri}`);
        return memConn;
      } catch (memErr) {
        console.error('[Drinko DB] Failed to start in-memory MongoDB:', memErr.message);
        throw primaryErr;
      }
    }
  } catch (error) {
    lastFailedAttempt = Date.now();
    console.error('[Drinko DB] Database Connection Notice:', error.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }

};

module.exports = connectDB;
