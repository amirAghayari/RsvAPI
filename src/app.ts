import express from "express";
import * as dotenv from "dotenv";
import AppDataSource from "./config/dataSource";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

import { authenticate } from "./middlewares/auth.middleware";
import AuthRouter from "./routes/auth.routes";
import ReservationRouter from "./routes/reservation.routes";
import EventRouter from "./routes/event.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Swagger UI
// TODO :
app.use("/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) => {
  res.send("Hello from Ticket Reservation API!");
});

// auth routes

app.use("/auth", AuthRouter);
app.use("/reservations", ReservationRouter);
app.use("/events", EventRouter);

// protected example
app.get("/me", authenticate, (req, res) => {
  const user = (req as any).user;
  console.log("Authenticated user:", user);
  res.json({ id: user.id });
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected!");
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error: unknown) => console.log("DB connection error:", error));
