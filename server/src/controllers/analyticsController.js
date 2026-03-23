const Url = require('../models/Url');
const { getAnalytics } = require('../services/analyticsService');

// GET /api/analytics/:shortCode
// Returns full analytics for a short link
exports.getUrlAnalytics = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Find the URL
    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found' });
    }

    // Check ownership — only creator can see analytics
    if (url.createdBy && url.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view analytics for this URL' });
    }

    // Get analytics data
    const analytics = await getAnalytics(shortCode);

    res.status(200).json({
      success: true,
      data: {
        shortCode,
        shortUrl: `${process.env.BASE_URL}/${shortCode}`,
        originalUrl: url.originalUrl,
        createdAt: url.createdAt,
        ...analytics,
      },
    });
  } catch (err) {
    next(err);
  }
};