const Redis = require('ioredis');

let redisClient;

const connectRedis = () => {
  redisClient = new Redis(process.env.REDIS_URL, {
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });
  redisClient.on('connect', () => console.log('Redis connected'));
  redisClient.on('error', (err) => console.error(`Redis error: ${err.message}`));
};

const getRedis = () => {
  if (!redisClient) throw new Error('Redis not initialized');
  return redisClient;
};

module.exports = { connectRedis, getRedis };