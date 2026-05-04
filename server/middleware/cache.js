/**
 * Simple in-memory cache middleware.
 * Caches GET responses by URL for a configurable TTL.
 */
const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

function cacheMiddleware(ttl = DEFAULT_TTL) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return res.json(cached.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, timestamp: Date.now() });
      // Cleanup old entries periodically
      if (cache.size > 500) {
        const now = Date.now();
        for (const [k, v] of cache) {
          if (now - v.timestamp > ttl) cache.delete(k);
        }
      }
      return originalJson(data);
    };

    next();
  };
}

function clearCache() {
  cache.clear();
}

module.exports = { cacheMiddleware, clearCache };
