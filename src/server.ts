import initializeDatabase from "./app/db";
import app from "./app/index";
import { logger } from "./logger/logger";

const port = process.env.PORT || 3000;

const server = app.listen(port, async () => {
  await initializeDatabase();

  logger.info(
    {
      port,
      environment: process.env.NODE_ENV,
    },
    "Server started successfully",
  );

  logger.info(
    {
      url: `http://localhost:${port}/docs`,
    },
    "Swagger documentation available",
  );
});

process.on("unhandledRejection", (err: Error) => {
  logger.error(
    {
      err,
    },
    "Unhandled rejection detected. Shutting down server...",
  );

  server.close(() => {
    process.exit(1);
  });
});
