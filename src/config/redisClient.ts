import { createClient } from "redis";

const DEFAULT_REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

type RedisClientInstance = ReturnType<typeof createClient>;

export const createRedisClient = (url?: string): RedisClientInstance => {
  const redisUrl = url || DEFAULT_REDIS_URL;

  const client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 5) {
          return new Error("Redis reconnect attempts exhausted");
        }

        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on("error", (err) => {
    console.error("Redis Client Error", err.message);
  });
  client.on("connect", () => console.log("✅ Redis connected successfully"));
  client.on("ready", () => console.log("✅ Redis connected and ready"));

  return client;
};

let redisClient: RedisClientInstance | null = null;

export const getRedisClient = async (): Promise<RedisClientInstance> => {
  if (!redisClient) {
    redisClient = createRedisClient();
    await redisClient.connect();
  }

  if (!redisClient.isReady && !redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
};

export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
