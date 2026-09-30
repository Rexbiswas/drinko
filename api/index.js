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
  let requestPath = req.url || '/api';

  try {
    const parsed = new URL(requestPath, 'http://localhost');
    const pathParam = parsed.searchParams.get('path');
    if (pathParam !== null && pathParam !== undefined) {
      parsed.searchParams.delete('path');
      const cleanSub = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
      const search = parsed.searchParams.toString();
      requestPath = `/api${cleanSub}${search ? `?${search}` : ''}`;
    } else if (req.headers && req.headers['x-forwarded-url']) {
      const fwd = new URL(req.headers['x-forwarded-url'], 'https://drinko.local');
      requestPath = fwd.pathname + (fwd.search || '');
    }
  } catch (err) {
    // Keep fallback requestPath
  }

  const [pathname, search] = requestPath.split('?');
  let normalizedPath = pathname;
  if (!normalizedPath.startsWith('/api')) {
    normalizedPath = '/api' + (normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath);
  }
  req.url = normalizedPath + (search ? `?${search}` : '');

  // 2. Establish database connection if not connected (non-blocking warning on failure)
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

  // 3. Delegate to Express app
  return app(req, res);
};

