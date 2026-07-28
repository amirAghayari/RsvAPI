import { createClient } from "redis";
import { logger } from "../logger/logger";

const DEFAULT_REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

type RedisClientInstance = ReturnType<typeof createClient>;

export const createRedisClient = (url?: string): RedisClientInstance => {
  const redisUrl = url || DEFAULT_REDIS_URL;

  const client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 5) {
          logger.error({ retries }, "Redis reconnect attempts exhausted");

          return new Error("Redis reconnect attempts exhausted");
        }

        logger.warn({ retries }, "Attempting to reconnect to Redis");

        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on("error", (err) => {
    logger.error({ err }, "Redis client error");
  });

  client.on("connect", () => {
    logger.info("Redis connected");
  });

  client.on("ready", () => {
    logger.info("Redis is ready");
  });

  return client;
};

let redisClient: RedisClientInstance | null = null;

export const getRedisClient = async (): Promise<RedisClientInstance> => {
  if (!redisClient) {
    redisClient = createRedisClient();
    await redisClient.connect();
  }

  if (!redisClient.isReady && !redisClient.isOpen) {
    logger.warn("Redis connection lost. Reconnecting...");
    await redisClient.connect();
  }

  return redisClient;
};

export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info("Redis connection closed");
    redisClient = null;
  }
};
