const { getRedis } = require('../config/redis');

// Default cache expiry — 24 hours in seconds
const DEFAULT_TTL = 60 * 60 * 24;

/**
 * Get a value from Redis cache
 * Returns parsed value or null if not found
 */
const cacheGet = async (key) => {
  try {
    const redis = getRedis();
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (err) {
    // If Redis fails, don't crash the app — just return null
    // The request will fall through to MongoDB
    console.error(`Cache GET error for key ${key}:`, err.message);
    return null;
  }
};

/**
 * Set a value in Redis cache with optional TTL
 * ttl is in seconds — defaults to 24 hours
 */
const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const redis = getRedis();
    // EX = expire in seconds
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    // If Redis fails, don't crash — just skip caching
    console.error(`Cache SET error for key ${key}:`, err.message);
  }
};

/**
 * Delete a value from Redis cache
 * Called when a URL is deleted or updated
 */
const cacheDelete = async (key) => {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (err) {
    console.error(`Cache DELETE error for key ${key}:`, err.message);
  }
};

/**
 * Build a consistent cache key for a short code
 * Using a prefix helps organize keys and avoid conflicts
 * Example: url:abc123
 */
const urlCacheKey = (shortCode) => `url:${shortCode}`;

module.exports = { cacheGet, cacheSet, cacheDelete, urlCacheKey };