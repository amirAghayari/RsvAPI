import AppDataSource from "../config/dataSource";

const initializeDatabase = () => {
  AppDataSource.initialize()
    .then(() => {
      console.log("Database connected!");
    })
    .catch((error: unknown) => {
      console.error("DB connection error:", error);
      process.exit(1);
    });
};

export default initializeDatabase;
