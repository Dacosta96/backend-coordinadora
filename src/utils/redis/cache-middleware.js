const redisClient = require('./redis-client');

const cacheMiddleware =
    (keyGenerator, ttlSeconds = 60) =>
    async (req, res, next) => {
        const key = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;

        try {
            const cached = await redisClient.get(key);
            if (cached) {
                console.log(`[CACHE HIT] ${key}`);
                return res.json(JSON.parse(cached));
            }

            // Hook into res.json to cache response
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                redisClient.setEx(key, ttlSeconds, JSON.stringify(body));
                return originalJson(body);
            };

            next();
        } catch (err) {
            console.error('Redis middleware error:', err?.message);
            next(); // fall back to handler if Redis fails
        }
    };

module.exports = cacheMiddleware;
