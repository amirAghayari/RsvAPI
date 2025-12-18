import express, { NextFunction, Request, Response } from "express";
import * as dotenv from "dotenv";
import AppDataSource from "./config/dataSource";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import AuthRouter from "./routes/auth.routes";
import ReservationRouter from "./routes/reservation.routes";
import EventRouter from "./routes/event.routes";
import LogRouter from "./routes/log.routes";
import rateLimit from "express-rate-limit";
import { AppError } from "./utils/AppError";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) => {
  res.send("Ticket Reservation API is running");
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { message: "Too many login attempts, try again later" },
});

app.use("/auth/login", loginLimiter);

app.use("/auth", AuthRouter);
app.use("/reservations", ReservationRouter);
app.use("/events", EventRouter);
app.use("/logs", LogRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal Server Error" });
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected!");

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log(`Swagger docs available at http://localhost:${port}/docs`);
    });
  })
  .catch((error: unknown) => {
    console.error("DB connection error:", error);
    process.exit(1);
  });
