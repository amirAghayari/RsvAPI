import { createClient, RedisClientType } from "redis";

export const createRedisClient = async (url?: string) => {
  const client = createClient({
    url: url || process.env.REDIS_URL || "redis://localhost:6370",
  });

  client.on("error", (err) => {
    console.error("Redis Client Error", err);
  });
  client.on("connect", () => console.log("✅ Redis connected successfully"));

  return client;
};

let redisClient: RedisClientType | null = null;

export const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    redisClient = createClient();
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
