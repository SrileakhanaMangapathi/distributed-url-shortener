const Url = require('../models/Url');
const { generateShortCode, isValidUrl } = require('../services/shortCodeService');
const { cacheGet, cacheSet, cacheDelete, urlCacheKey } = require('../services/cacheService');

// ─── POST /api/urls/shorten ───────────────────────────────────────────────────
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

    // 2. Handle custom alias or generate short code
    let shortCode = customAlias || generateShortCode();

    // 3. Check if custom alias is already taken
    if (customAlias) {
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Custom alias already taken. Try another.' });
      }
    } else {
      // Ensure uniqueness
      let isUnique = false;
      while (!isUnique) {
        const existing = await Url.findOne({ shortCode });
        if (!existing) isUnique = true;
        else shortCode = generateShortCode();
      }
    }

    // 4. Calculate expiry date if provided
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    }

    // 5. Save to MongoDB
    const url = await Url.create({
      originalUrl,
      shortCode,
      customAlias: customAlias || null,
      expiresAt,
      createdBy: req.user ? req.user._id : null,
    });

    // 6. Cache the new URL immediately so first redirect is fast too
    await cacheSet(urlCacheKey(shortCode), {
      originalUrl,
      expiresAt,
      isActive: true,
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
// This is the HOT PATH — called every time someone clicks a short link
// Cache-aside pattern:
//   1. Check Redis first (fast ~3ms)
//   2. If miss, check MongoDB (~80ms)
//   3. Store result in Redis for next time
exports.redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const cacheKey = urlCacheKey(shortCode);

    // ── STEP 1: Check Redis cache ──────────────────────────────────────────
    const cached = await cacheGet(cacheKey);

    if (cached) {
      // CACHE HIT ⚡ — serve from Redis in ~3ms
      console.log(`Cache HIT for ${shortCode}`);

      // Check expiry
      if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
        await cacheDelete(cacheKey);
        return res.status(410).json({ success: false, message: 'This link has expired' });
      }

      // Increment click count async (don't await — keep redirect fast!)
      Url.findOneAndUpdate({ shortCode }, { $inc: { clicks: 1 } }).exec();

      return res.redirect(302, cached.originalUrl);
    }

    // ── STEP 2: Cache MISS — check MongoDB ────────────────────────────────
    console.log(`Cache MISS for ${shortCode} — querying MongoDB`);
    const url = await Url.findOne({ shortCode, isActive: true });

    if (!url) {
      return res.status(404).json({ success: false, message: 'Short URL not found' });
    }

    // Check expiry
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This link has expired' });
    }

    // ── STEP 3: Store in Redis for next time ──────────────────────────────
    await cacheSet(cacheKey, {
      originalUrl: url.originalUrl,
      expiresAt: url.expiresAt,
      isActive: url.isActive,
    });

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

    // Delete from cache too — important!
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