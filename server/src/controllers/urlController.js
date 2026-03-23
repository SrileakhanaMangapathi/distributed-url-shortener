const Url = require('../models/Url');
const { generateShortCode, isValidUrl } = require('../services/shortCodeService');
const { cacheGet, cacheSet, cacheDelete, urlCacheKey } = require('../services/cacheService');
const { trackClick } = require('../services/analyticsService');

// ─── POST /api/urls/shorten ───────────────────────────────────────────────────
exports.shortenUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiresIn } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid URL format. Must start with http:// or https://' });
    }

    let shortCode = customAlias || generateShortCode();

    if (customAlias) {
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Custom alias already taken.' });
      }
    } else {
      let isUnique = false;
      while (!isUnique) {
        const existing = await Url.findOne({ shortCode });
        if (!existing) isUnique = true;
        else shortCode = generateShortCode();
      }
    }

    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    }

    const url = await Url.create({
      originalUrl,
      shortCode,
      customAlias: customAlias || null,
      expiresAt,
      createdBy: req.user ? req.user._id : null,
    });

    // Cache immediately
    await cacheSet(urlCacheKey(shortCode), {
      originalUrl,
      expiresAt,
      isActive: true,
      urlId: url._id.toString(),
    });

    const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

    res.status(201).json({
      success: true,
      data: { shortUrl, shortCode, originalUrl, expiresAt, createdAt: url.createdAt },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /:shortCode ──────────────────────────────────────────────────────────
exports.redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const cacheKey = urlCacheKey(shortCode);

    // Check Redis cache first
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log(`Cache HIT for ${shortCode}`);

      if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
        await cacheDelete(cacheKey);
        return res.status(410).json({ success: false, message: 'This link has expired' });
      }

      // Track click ASYNC — don't wait, keep redirect fast!
      if (cached.urlId) {
        trackClick({ shortCode, urlId: cached.urlId, req });
      }

      // Increment click count async
      Url.findOneAndUpdate({ shortCode }, { $inc: { clicks: 1 } }).exec();

      return res.redirect(302, cached.originalUrl);
    }

    // Cache miss — query MongoDB
    console.log(`Cache MISS for ${shortCode} — querying MongoDB`);
    const url = await Url.findOne({ shortCode, isActive: true });

    if (!url) {
      return res.status(404).json({ success: false, message: 'Short URL not found' });
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This link has expired' });
    }

    // Cache for next time — include urlId for analytics
    await cacheSet(cacheKey, {
      originalUrl: url.originalUrl,
      expiresAt: url.expiresAt,
      isActive: url.isActive,
      urlId: url._id.toString(),
    });

    // Track click ASYNC
    trackClick({ shortCode, urlId: url._id, req });

    // Increment click count async
    Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } }).exec();

    return res.redirect(302, url.originalUrl);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/urls ────────────────────────────────────────────────────────────
exports.getUserUrls = async (req, res, next) => {
  try {
    const urls = await Url.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

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
exports.deleteUrl = async (req, res, next) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found' });
    }

    if (url.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this URL' });
    }

    await cacheDelete(urlCacheKey(url.shortCode));
    await url.deleteOne();

    res.status(200).json({ success: true, message: 'URL deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/urls/:shortCode ─────────────────────────────────────────────────
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