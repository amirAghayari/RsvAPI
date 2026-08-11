import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
});

import { TestDataSource, clearDatabase } from "./helpers/database";
import AppDataSource from "../src/config/dataSource";

beforeAll(async () => {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
    await AppDataSource.initialize();
  }
});

beforeEach(async () => {
  await clearDatabase();

  const result = await TestDataSource.query(`SELECT COUNT(*) FROM users`);

  console.log(result);
});
afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
});
