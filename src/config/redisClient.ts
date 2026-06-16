import { createClient, RedisClientType } from "redis";

export const createRedisClient = (url?: string) => {
  const client = createClient({
    url: url || process.env.REDIS_URL || "redis://localhost:6370",
  });

  client.on("error", (err) => {
    console.error("Redis Client Error", err);
  });
  client.on("connect", () => console.log("✅ Redis connected successfully"));
  client.on("ready", () => console.log("✅ Redis connected and ready"));
  return client;
};

let redisClient: any = null;

export const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    redisClient = createRedisClient();
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
