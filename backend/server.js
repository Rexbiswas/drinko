const express = require('express');
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const { initSocket } = require('./services/socket.service');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const Product = require('./models/Product');
const seedData = require('./utils/seed');

// Connect to Database & Auto-seed if database is fresh/empty (Standalone daemon mode)
if (require.main === module) {
  connectDB().then(async () => {
    try {
      const prodCount = await Product.countDocuments();
      if (prodCount === 0) {
        console.log('[Drinko DB] Fresh database detected. Auto-seeding initial categories, products, inventory, tables & users...');
        await seedData();
      }
    } catch (err) {
      console.warn('[Drinko DB] Auto-seed check note:', err.message);
    }
  }).catch(err => {
    console.warn('[Drinko DB] Initial startup connection note:', err.message);
  });
}

const app = express();
const server = http.createServer(app);

// Enable trust proxy for Vercel/reverse proxies (accurate client IPs and secure headers)
app.set('trust proxy', 1);

// Initialize Real-time Socket.IO (only in persistent server environments, not on serverless Vercel)
if (!process.env.VERCEL) {
  initSocket(server);
}

// URL Normalization Middleware for Vercel Rewrites
app.use((req, res, next) => {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const pathParam = urlObj.searchParams.get('path');
    if (pathParam !== null && pathParam !== undefined) {
      urlObj.searchParams.delete('path');
      const cleanSub = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
      const search = urlObj.searchParams.toString();
      req.url = `/api${cleanSub}${search ? `?${search}` : ''}`;
    } else if (req.headers && req.headers['x-forwarded-url']) {
      const fwd = new URL(req.headers['x-forwarded-url'], 'https://drinko.local');
      req.url = fwd.pathname + (fwd.search || '');
    }
  } catch (err) {}

  if (!req.url.startsWith('/api') && req.url.startsWith('/')) {
    // If not starting with /api but accessing an api endpoint name
    const topSegments = ['auth', 'products', 'categories', 'orders', 'reviews', 'inventory', 'coupons', 'payment', 'loyalty', 'tables', 'admin', 'profile', 'health'];
    const firstSegment = req.url.split('/')[1]?.split('?')[0];
    if (topSegments.includes(firstSegment)) {
      req.url = `/api${req.url}`;
    }
  }
  next();
});

// Non-blocking On-demand Database Connection for Serverless (skips non-DB routes like health & google config)
app.use(async (req, res, next) => {
  const isExcluded = req.url === '/api' || req.url === '/api/health' || req.url.startsWith('/api/auth/google/config');
  if (!isExcluded) {
    try {
      await connectDB();
    } catch (dbErr) {
      console.warn('[Drinko DB Connection Notice]', dbErr.message);
    }
  }
  next();
});

// Security Headers with relaxed CSP to allow CDN fonts, icons, Unsplash images & Socket.IO
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sanitize user-supplied data to prevent MongoDB Operator Injection
app.use(mongoSanitize());

// Apply rate limiting to all /api/ endpoints
app.use('/api', apiLimiter);

// Mount API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/auth', require('./routes/auth.routes')); // Serverless path fallback
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/products', require('./routes/product.routes')); // Serverless path fallback
app.use('/api/categories', require('./routes/category.routes'));
app.use('/categories', require('./routes/category.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api/loyalty', require('./routes/loyalty.routes'));
app.use('/api/tables', require('./routes/table.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Root API & Health check endpoints
app.get(['/api', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'Drinko Full-Stack Café Platform',
    timestamp: new Date()
  });
});

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve Static Frontend Assets & Pages
app.use(express.static(path.join(__dirname, '../')));

// Explicit clean routes for frontend pages
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../admin/index.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, '../admin/index.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, '../pages/profile.html')));
app.get('/order', (req, res) => res.sendFile(path.join(__dirname, '../pages/order.html')));
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, '../pages/menu.html')));
app.get('/delivery', (req, res) => res.sendFile(path.join(__dirname, '../pages/delivery.html')));
app.get('/reviews', (req, res) => res.sendFile(path.join(__dirname, '../pages/reviews.html')));

// Fallback route for SPA or HTML pages
app.get('*', (req, res, next) => {
  // If request looks like an API call, let it go to 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
  }
  const indexPath = path.join(__dirname, '../index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).json({ success: false, message: 'Page Not Found' });
});


// Centralized Error Handling Middleware
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  DRINKO FULL-STACK SERVER RUNNING ON PORT ${PORT}     `);
    console.log(`  Frontend: http://localhost:${PORT}                    `);
    console.log(`  Real-Time Socket.IO Active                            `);
    console.log(`  Admin:    http://localhost:${PORT}/admin              `);
    console.log(`=======================================================`);
  });
}

module.exports = { app, server };
