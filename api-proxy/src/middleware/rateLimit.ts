import { Request, Response, NextFunction } from 'express';

const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple sliding-window rate limiter.
 * @param maxRequests Max requests per window
 * @param windowSeconds Window duration in seconds
 */
export function rateLimitMiddleware(maxRequests = 60, windowSeconds = 60) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const ip = req.ip || 'unknown';
        const now = Date.now();
        let entry = hits.get(ip);

        if (!entry || entry.resetAt < now) {
            entry = { count: 0, resetAt: now + windowSeconds * 1000 };
            hits.set(ip, entry);
        }

        entry.count++;

        if (entry.count > maxRequests) {
            res.status(429).json({ error: 'Too many requests' });
            return;
        }

        next();
    };
}
