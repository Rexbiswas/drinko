const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../backend/config/db');
const { app } = require('../backend/server');
const Product = require('../backend/models/Product');
const seedData = require('../backend/utils/seed');

let isSeeded = false;

module.exports = async (req, res) => {
  // 1. Establish database connection
  try {
    await connectDB();
    if (!isSeeded) {
      try {
        const count = await Product.countDocuments();
        if (count === 0) {
          console.log('[Drinko Vercel] Seeding initial database records...');
          await seedData();
        }
      } catch (seedErr) {
        console.warn('[Drinko Seed Warning]', seedErr.message);
      }
      isSeeded = true;
    }
  } catch (dbErr) {
    console.warn('[Drinko Vercel DB Notice]', dbErr.message);
  }

  // 2. Normalize req.url so Express router matches /api/* endpoints
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  // 3. Delegate to Express app
  return app(req, res);
};
