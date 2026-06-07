import app from "./app/index";

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`server running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
});

// shutting down server when we have Unhandled error in server
process.on("unhandledRejection", (err: Error) => {
  console.error("Unhandled Rejection! shutting down...");
  console.error("Errror Message", err);
  server.close(() => {
    process.exit(1);
  });
});
