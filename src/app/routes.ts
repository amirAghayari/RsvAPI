import { Express, NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
// import ReservationRouter from "./../routes/reservation.routes";
// import EventRouter from "./../routes/event.routes";
// import LogRouter from "./../routes/log.routes";
import rateLimit from "express-rate-limit";
import { NotFoundError } from "../errors/not-found-error";
import { errorHandler } from "../middlewares/error-handler";
import { userRouter } from "../core/users/user.routes";
import { eventRouter } from "../core/events/event.routes";
import swaggerSpec from "./../config/swagger";

const routes = (app: Express) => {
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    message: { message: "Too many login attempts, try again later" },
  });

  // Swagger Ui route
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // home route
  app.get("/", (_req, res) => {
    res.send("Ticket Reservation API is running");
  });

  // API routes

  app.use("/api/V1/users/login", loginLimiter);

  app.use("/api/V1/users", userRouter);
  app.use("/api/V1/events", eventRouter);
  // app.use("/api/V1/reservations", ReservationRouter);
  // app.use("/api/V1/events", EventRouter);
  // app.use("/api/V1/logs", LogRouter);

  //  Not found routed
  app.all("/*splat", () => {
    throw new NotFoundError("The requested page was not found.");
  });

  // TODO :

  // Error handler
  if (process.env.NODE_ENV == "deployment") {
    app.use(
      (err: unknown, _req: Request, _res: Response, next: NextFunction) => {
        console.error("RAW ERROR :", err);
        next(err);
      },
    );
  }
  app.use(errorHandler);
};

export default routes;
