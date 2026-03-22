const express = require('express');
const router = express.Router();
const {
  shortenUrl,
  getUserUrls,
  deleteUrl,
  getUrlInfo,
} = require('../controllers/urlController');
const protect = require('../middleware/auth');

// Public routes (no login needed)
router.post('/shorten', shortenUrl);           // POST /api/urls/shorten

// Protected routes (login required)
router.get('/', protect, getUserUrls);          // GET  /api/urls
router.delete('/:id', protect, deleteUrl);      // DELETE /api/urls/:id
router.get('/:shortCode', getUrlInfo);          // GET  /api/urls/:shortCode

module.exports = router;