import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
});

import { TestDataSource, clearDatabase } from "./helpers/database";

beforeAll(async () => {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
  }
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
});
