const Url = require('../models/Url');
const { generateShortCode, isValidUrl } = require('../services/shortCodeService');

// ─── POST /api/urls/shorten ───────────────────────────────────────────────────
// Shorten a long URL → returns a short code
exports.shortenUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiresIn } = req.body;

    // 1. Validate the URL
    if (!originalUrl) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid URL format. Must start with http:// or https://' });
    }

    // 2. Handle custom alias if provided
    let shortCode = customAlias || generateShortCode();

    // 3. Check if custom alias is already taken
    if (customAlias) {
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Custom alias already taken. Try another.' });
      }
    } else {
      // Make sure randomly generated code is unique (very rare collision)
      let isUnique = false;
      while (!isUnique) {
        const existing = await Url.findOne({ shortCode });
        if (!existing) {
          isUnique = true;
        } else {
          shortCode = generateShortCode(); // try again
        }
      }
    }

    // 4. Calculate expiry date if provided
    let expiresAt = null;
    if (expiresIn) {
      // expiresIn is in hours e.g. 24 = expires in 24 hours
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    }

    // 5. Save to MongoDB
    const url = await Url.create({
      originalUrl,
      shortCode,
      customAlias: customAlias || null,
      expiresAt,
      // If user is logged in, attach their ID
      createdBy: req.user ? req.user._id : null,
    });

    // 6. Build the full short URL
    const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

    res.status(201).json({
      success: true,
      data: {
        shortUrl,
        shortCode,
        originalUrl,
        expiresAt,
        createdAt: url.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /:shortCode ──────────────────────────────────────────────────────────
// Redirect short URL → original URL
// This is the most frequently called endpoint — keep it fast!
exports.redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // 1. Look up in MongoDB
    const url = await Url.findOne({ shortCode, isActive: true });

    // 2. Not found
    if (!url) {
      return res.status(404).json({ success: false, message: 'Short URL not found or has been deleted' });
    }

    // 3. Check if expired
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This link has expired' });
    }

    // 4. Increment click count (async — don't wait for it)
    // We use $inc so it's atomic — safe even with multiple servers
    Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } }).exec();

    // 5. Redirect to original URL
    // 302 = temporary redirect (not cached by browser — important for analytics!)
    return res.redirect(302, url.originalUrl);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/urls ────────────────────────────────────────────────────────────
// Get all URLs created by the logged-in user
exports.getUserUrls = async (req, res, next) => {
  try {
    const urls = await Url.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 }) // newest first
      .select('-__v');          // exclude MongoDB version field

    res.status(200).json({
      success: true,
      count: urls.length,
      data: urls.map((url) => ({
        id: url._id,
        shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        clicks: url.clicks,
        expiresAt: url.expiresAt,
        createdAt: url.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/urls/:id ─────────────────────────────────────────────────────
// Delete a URL (only the creator can delete it)
exports.deleteUrl = async (req, res, next) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found' });
    }

    // Make sure only the creator can delete
    if (url.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this URL' });
    }

    await url.deleteOne();

    res.status(200).json({ success: true, message: 'URL deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/urls/:shortCode ─────────────────────────────────────────────────
// Get info about a specific short URL (no redirect)
exports.getUrlInfo = async (req, res, next) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });

    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        clicks: url.clicks,
        expiresAt: url.expiresAt,
        createdAt: url.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};