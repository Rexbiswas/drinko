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
  // 1. Establish database connection if not connected
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

  // 2. Extract and normalize incoming URL so Express router always matches /api/*
  let requestPath = req.url || '/api';
  if (req.headers && req.headers['x-forwarded-url']) {
    try {
      const parsed = new URL(req.headers['x-forwarded-url'], 'https://drinko.local');
      requestPath = parsed.pathname;
    } catch (e) {
      requestPath = req.headers['x-forwarded-url'];
    }
  }

  const [pathname, search] = requestPath.split('?');
  let normalizedPath = pathname;
  if (!normalizedPath.startsWith('/api')) {
    normalizedPath = '/api' + (normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath);
  }
  req.url = normalizedPath + (search ? `?${search}` : '');

  // 3. Delegate to Express app
  return app(req, res);
};
