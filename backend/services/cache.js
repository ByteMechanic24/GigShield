const { redis, getJson, setJson } = require('../db/redisClient');

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function buildCacheKey(namespace, parts = {}) {
  return `${namespace}:${stableStringify(parts)}`;
}

async function getOrSetJson(key, ttlSeconds, resolver) {
  const cached = await getJson(key);
  if (cached !== null) {
    return { value: cached, cacheHit: true };
  }

  const value = await resolver();
  await setJson(key, value, ttlSeconds);
  return { value, cacheHit: false };
}

async function deleteByPatterns(patterns = []) {
  const uniquePatterns = [...new Set(patterns.filter(Boolean))];

  for (const pattern of uniquePatterns) {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  }
}

function workerClaimsPattern(workerId) {
  return `claims:worker:*"workerId":"${workerId}"*`;
}

function workerPolicyPattern(workerId) {
  return `policy:current:*"workerId":"${workerId}"*`;
}

function workerSessionPattern(workerId) {
  return `worker:session:*"workerId":"${workerId}"*`;
}

function adminClaimsPattern() {
  return 'claims:admin:*';
}

module.exports = {
  adminClaimsPattern,
  buildCacheKey,
  deleteByPatterns,
  getOrSetJson,
  workerClaimsPattern,
  workerPolicyPattern,
  workerSessionPattern,
};
