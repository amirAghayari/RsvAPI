import AppDataSource from "../config/dataSource";
import { getRedisClient } from "../config/redisClient";

const initializeDatabase = async () => {
  AppDataSource.initialize()
    .then(() => {
      console.log("Database connected!");
    })
    .catch((error: unknown) => {
      console.error("DB connection error:", error);
      process.exit(1);
    });

  await getRedisClient();
};

export default initializeDatabase;
