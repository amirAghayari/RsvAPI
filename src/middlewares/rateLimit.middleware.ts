import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import ms from "ms";
import { getRedisClient } from "../config/redisClient";

// Limit requests
export const limiter = rateLimit({
  windowMs: ms("5m"),
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Your IP requests are too high, please try again in 15 minutes.",
  },
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      const client = await getRedisClient();

      return client.sendCommand(args);
    },
  }),
});

// limiter for login route
export const loginLimiter = rateLimit({
  windowMs: ms("8m"),
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, try again later" },
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      const client = await getRedisClient();

      return client.sendCommand(args);
    },
  }),
});
