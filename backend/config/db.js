const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drinko';
    
    // Set a quick serverSelectionTimeoutMS so if local mongod is absent, we can fall back to in-memory MongoDB
    mongoose.set('strictQuery', true);
    
    try {
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 2500
      });
      console.log(`[Drinko DB] Connected to MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (primaryErr) {
      console.warn(`[Drinko DB] Could not connect to primary MongoDB at ${mongoURI} (${primaryErr.message}).`);
      
      // Fallback: Use mongodb-memory-server for seamless local development
      try {
        console.log('[Drinko DB] Starting in-memory MongoDB server for development...');
        const path = require('path');
        const fs = require('fs');
        const dataDir = path.join(__dirname, '../../.mongo_data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const { MongoMemoryServer } = require('mongodb-memory-server');
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
    console.error('[Drinko DB] Critical Error connecting to Database:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
