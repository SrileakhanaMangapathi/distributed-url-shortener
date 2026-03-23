const Click = require('../models/Click');
const Url = require('../models/Url');

/**
 * Parse device type from User-Agent string
 * User-Agent is a header browsers send identifying themselves
 * Example: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0...)"
 */
const parseDevice = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

/**
 * Parse browser from User-Agent string
 */
const parseBrowser = (userAgent = '') => {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  return 'Other';
};

/**
 * Parse OS from User-Agent string
 */
const parseOS = (userAgent = '') => {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Other';
};

/**
 * Get referrer category from referrer URL
 */
const parseReferrer = (referrer = '') => {
  if (!referrer) return 'direct';
  if (referrer.includes('google')) return 'Google';
  if (referrer.includes('facebook') || referrer.includes('fb.com')) return 'Facebook';
  if (referrer.includes('twitter') || referrer.includes('t.co')) return 'Twitter';
  if (referrer.includes('linkedin')) return 'LinkedIn';
  if (referrer.includes('instagram')) return 'Instagram';
  return 'other';
};

/**
 * Simple hash function for IP addresses
 * We hash IPs for privacy — we know if it's a unique visitor
 * without storing their actual IP address
 */
const hashIP = (ip) => {
  if (!ip) return null;
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Track a click event — called every time someone clicks a short link
 * This runs ASYNC — we don't wait for it so the redirect stays fast
 */
const trackClick = async ({ shortCode, urlId, req }) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    await Click.create({
      shortCode,
      url: urlId,
      device: parseDevice(userAgent),
      browser: parseBrowser(userAgent),
      os: parseOS(userAgent),
      referrer: parseReferrer(referrer),
      country: 'unknown', // Would need a GeoIP service for real country data
      ipHash: hashIP(ip),
    });
  } catch (err) {
    // Never let analytics errors crash the redirect
    console.error('Analytics tracking error:', err.message);
  }
};

/**
 * Get analytics summary for a short code
 * Returns aggregated stats — total clicks, by device, by browser etc.
 */
const getAnalytics = async (shortCode) => {
  // Total clicks
  const totalClicks = await Click.countDocuments({ shortCode });

  // Clicks by device
  const byDevice = await Click.aggregate([
    { $match: { shortCode } },
    { $group: { _id: '$device', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Clicks by browser
  const byBrowser = await Click.aggregate([
    { $match: { shortCode } },
    { $group: { _id: '$browser', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Clicks by OS
  const byOS = await Click.aggregate([
    { $match: { shortCode } },
    { $group: { _id: '$os', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Clicks by referrer
  const byReferrer = await Click.aggregate([
    { $match: { shortCode } },
    { $group: { _id: '$referrer', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Clicks over time — last 7 days grouped by day
  const last7Days = await Click.aggregate([
    {
      $match: {
        shortCode,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    totalClicks,
    byDevice: byDevice.map((d) => ({ name: d._id, count: d.count })),
    byBrowser: byBrowser.map((d) => ({ name: d._id, count: d.count })),
    byOS: byOS.map((d) => ({ name: d._id, count: d.count })),
    byReferrer: byReferrer.map((d) => ({ name: d._id, count: d.count })),
    last7Days: last7Days.map((d) => ({ date: d._id, count: d.count })),
  };
};

module.exports = { trackClick, getAnalytics };