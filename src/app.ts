import express, { NextFunction, Request, Response } from "express";
import * as dotenv from "dotenv";
import AppDataSource from "./config/dataSource";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import { authenticate } from "./middlewares/auth.middleware";
import AuthRouter from "./routes/auth.routes";
import ReservationRouter from "./routes/reservation.routes";
import EventRouter from "./routes/event.routes";
import LogRouter from "./routes/log.routes";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) => {
  res.send("Hello from Ticket Reservation API!");
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { message: "Too many login attempts, try again later" },
});

app.use("/auth/login", limiter);

app.use("/auth", AuthRouter);
app.use("/reservations", ReservationRouter);
app.use("/events", EventRouter);
app.use("/logs", LogRouter);

// protected example
// app.get("/me", authenticate, (req, res) => {
//   const user = (req as any).user;
//   console.log("Authenticated user:", user);
//   res.json({ id: user?.id });
// });

// Global Error Handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected!");
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log(
        `Swagger docs available at http://localhost:${port}/api-docs`
      );
    });
  })
  .catch((error: unknown) => console.log("DB connection error:", error));
