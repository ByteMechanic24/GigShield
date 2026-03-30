const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl);

// ── Connection event handlers (never crash the process) ──
redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

// ── Helper functions ─────────────────────────────────────

/**
 * Store a JSON-serializable value with an optional TTL.
 * @param {string}  key         Redis key
 * @param {*}       value       Any JSON-serializable value
 * @param {number}  ttlSeconds  Time-to-live in seconds (0 = no expiry)
 */
async function setJson(key, value, ttlSeconds = 0) {
  const serialized = JSON.stringify(value);
  if (ttlSeconds > 0) {
    await redis.set(key, serialized, 'EX', ttlSeconds);
  } else {
    await redis.set(key, serialized);
  }
}

/**
 * Retrieve and parse a JSON value from Redis.
 * @param  {string} key  Redis key
 * @return {*|null}      Parsed value, or null if key does not exist
 */
async function getJson(key) {
  const raw = await redis.get(key);
  if (raw === null) return null;
  return JSON.parse(raw);
}

/**
 * Delete a key from Redis.
 * @param  {string} key  Redis key
 * @return {number}      Number of keys removed (0 or 1)
 */
async function deleteKey(key) {
  return redis.del(key);
}

module.exports = {
  redis,
  setJson,
  getJson,
  deleteKey,
};
