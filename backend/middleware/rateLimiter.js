const rateLimit = require('express-rate-limit');

// Helper to reliably extract client IP behind reverse proxies (Vercel, Cloudflare, etc.)
const getClientIp = (req) => {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (req.headers && req.headers['x-real-ip']) || req.ip || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
};

// Rate limiter for authentication routes (login/register) to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Prevents express-rate-limit from throwing validation errors on serverless/proxies
  keyGenerator: getClientIp,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Prevents express-rate-limit from throwing validation errors on serverless/proxies
  keyGenerator: getClientIp,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  }
});

module.exports = { authLimiter, apiLimiter };

