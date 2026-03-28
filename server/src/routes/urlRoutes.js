const express = require('express');
const router = express.Router();
const {
  shortenUrl,
  getUserUrls,
  deleteUrl,
  getUrlInfo,
} = require('../controllers/urlController');
const protect = require('../middleware/auth');
const { optionalProtect } = require('../middleware/auth');
const { shortenLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/shorten', optionalProtect, shortenLimiter, shortenUrl);  // POST /api/urls/shorten

// Protected routes
router.get('/', protect, getUserUrls);                // GET  /api/urls
router.delete('/:id', protect, deleteUrl);            // DELETE /api/urls/:id
router.get('/:shortCode', getUrlInfo);                // GET  /api/urls/:shortCode

module.exports = router;
