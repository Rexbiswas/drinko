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

// Initialize Real-time Socket.IO
initSocket(server);

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
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api/loyalty', require('./routes/loyalty.routes'));
app.use('/api/tables', require('./routes/table.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
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
  // Otherwise serve index.html
  res.sendFile(path.join(__dirname, '../index.html'));
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
