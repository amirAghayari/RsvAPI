import express, { Express } from "express";
import "dotenv/config";
import routes from "./routes";
import config from "./config";
import { closeRedisConnection } from "../config/redisClient";
import { logger } from "../logger/logger";

const app = express() as Express;

process.on("uncaughtException", (err: Error) => {
  logger.fatal(
    { err },
    "Uncaught exception detected. Shutting down application",
  );

  process.exit(1);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Closing Redis connection...");

  await closeRedisConnection();

  logger.info("Redis connection closed. Application stopped.");

  process.exit(0);
});

config(app);
routes(app);

export default app;
