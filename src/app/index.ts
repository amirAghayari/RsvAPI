import express, { Express } from "express";
import "dotenv/config";
import initializeDatabase from "./db";
import routes from "./routes";
import config from "./config";
import { closeRedisConnection } from "../config/redisClient";

const app = express() as Express;

process.on("uncaughtException", (err: Error) => {
  console.error("🔹Uncaught Exception! Shutting down...");
  console.error("🔹Error Message:", err.message);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await closeRedisConnection();
  process.exit(0);
});

initializeDatabase();

config(app);
routes(app);

export default app;
