import { TestDataSource } from "./helpers/database";

export default async function teardown() {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
}
