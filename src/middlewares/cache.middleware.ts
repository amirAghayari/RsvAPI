import { NextFunction, Request, Response } from "express";
import { getRedisClient } from "../config/redisClient";

type CachePayload = {
  status: number;
  body: unknown;
};

const DEFAULT_TTL_SECONDS = 60;

// create a cache key based on the request method and URL
const getCacheKey = (req: Request) => `cache:${req.method}:${req.originalUrl}`;

export const cacheRoute = (ttlSeconds = DEFAULT_TTL_SECONDS) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // HTTP HEAD method requests the exact same response headers that an HTTP GET request would return, but without the response body
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    const cacheKey = getCacheKey(req);

    try {
      const client = await getRedisClient();
      // Check if the response is already cached
      const cachedValue = await client.get(cacheKey);

      if (cachedValue) {
        // deserialize the cached value and send it as the response
        const parsedCache = JSON.parse(cachedValue) as CachePayload;

        // set cache headers
        res.set("X-Cache", "HIT");
        res.set("Cache-Control", `public, max-age=${ttlSeconds}`);

        return res.status(parsedCache.status).json(parsedCache.body);
      }
    } catch (error) {
      console.warn(
        "Redis cache lookup failed, continuing without cache:",
        error,
      );
    }

    // If the response is not cached, proceed to the next middleware or route handler
    res.set("X-Cache", "MISS");
    res.set("Cache-Control", `public, max-age=${ttlSeconds}`);

    let responseSaved = false;

    const saveResponseToCache = async (body: unknown, statusCode: number) => {
      if (responseSaved) return;
      responseSaved = true;

      try {
        const client = await getRedisClient();
        await client.set(
          cacheKey,
          //  serialize the response body and status code to store in Redis
          JSON.stringify({ status: statusCode, body } as CachePayload),
          {
            EX: ttlSeconds,
          },
        );
      } catch (error) {
        console.warn("Redis cache write failed:", error);
      }
    };

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      void saveResponseToCache(body, res.statusCode || 200);
      return originalJson(body);
    }) as typeof res.json;

    const originalSend = res.send.bind(res);
    res.send = ((body: unknown) => {
      void saveResponseToCache(body, res.statusCode || 200);
      return originalSend(body as any);
    }) as typeof res.send;

    return next();
  };
};

export const clearCacheByPattern = async (pattern: string) => {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);

    if (!keys.length) {
      return;
    }

    await client.del(keys);
  } catch (error) {
    console.warn("Redis cache invalidation failed:", error);
  }
};
