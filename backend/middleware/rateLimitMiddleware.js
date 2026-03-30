const rateLimits = new Map();

const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

const rateLimitMiddleware = (req, res, next) => {
    const userId = req.user.userId;
    const now = Date.now();

    const userLimit = rateLimits.get(userId);

    if (!userLimit) {
        rateLimits.set(userId, { count: 1, startTime: now });
        return next();
    }

    if (now - userLimit.startTime < WINDOW_MS) {
        userLimit.count += 1;
        if (userLimit.count > RATE_LIMIT) {
            return res.status(429).json({ message: "Too many requests, please try again later" });
        }
        return next();
    }

    // Window expired, reset
    rateLimits.set(userId, { count: 1, startTime: now });
    return next();
};

module.exports = rateLimitMiddleware;
