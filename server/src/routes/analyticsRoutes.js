const express = require('express');
const router = express.Router();
const { getUrlAnalytics } = require('../controllers/analyticsController');
const protect = require('../middleware/auth');

// GET /api/analytics/:shortCode — protected, only creator can view
router.get('/:shortCode', protect, getUrlAnalytics);

module.exports = router;