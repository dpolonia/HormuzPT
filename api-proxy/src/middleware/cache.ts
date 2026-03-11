import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
    data: unknown;
    expiry: number;
}

const store = new Map<string, CacheEntry>();

/**
 * In-memory TTL cache middleware.
 * @param ttlSeconds Time-to-live in seconds
 */
export function cacheMiddleware(ttlSeconds: number) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (req.method !== 'GET') { next(); return; }

        const key = req.originalUrl;
        const cached = store.get(key);

        if (cached && cached.expiry > Date.now()) {
            res.json(cached.data);
            return;
        }

        // Intercept res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = (body: unknown) => {
            store.set(key, { data: body, expiry: Date.now() + ttlSeconds * 1000 });
            return originalJson(body);
        };

        next();
    };
}

export function clearCache(): void {
    store.clear();
}
