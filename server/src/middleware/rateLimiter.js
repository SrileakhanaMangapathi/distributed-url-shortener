const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';
const skipInTest = () => isTest;

/**
 * Basic rate limiter using express-rate-limit
 * 
 * Why rate limiting?
 * - Prevents abuse (someone shortening 10,000 URLs/minute)
 * - Protects your free MongoDB/Redis quotas
 * - Required for any production API
 * 
 * In Java terms: like a Servlet Filter that counts requests
 */

// General API rate limiter — 100 requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute window
  max: 100,               // max 100 requests per window
  skip: skipInTest,
  standardHeaders: true,  // Return rate limit info in headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please wait a minute and try again.',
  },
});

// Stricter limiter for URL shortening — 10 per minute
// Prevents spam shortening
const shortenLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute window
  max: 10,               // max 10 shortens per minute
  skip: skipInTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many URLs shortened. Please wait a minute.',
  },
});

// Auth limiter — 5 attempts per 15 minutes
// Prevents brute force login attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minute window
  max: 5,                     // max 5 attempts
  skip: skipInTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

module.exports = { apiLimiter, shortenLimiter, authLimiter };
