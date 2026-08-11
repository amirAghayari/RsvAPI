import AppDataSource from "../config/dataSource";
import { getRedisClient } from "../config/redisClient";
import { logger } from "../logger/logger";

const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.fatal({ err: error }, "Failed to connect to database");
    process.exit(1);
  }

  await getRedisClient();
};

export default initializeDatabase;
