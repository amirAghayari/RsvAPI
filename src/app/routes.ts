import { Express, NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

import { NotFoundError } from "../errors/not-found-error";
import { errorHandler } from "../middlewares/error-handler";
import { userRouter } from "../core/users/user.routes";
import { eventRouter } from "../core/events/event.routes";
import swaggerSpec from "./../config/swagger";
import { reservationRouter } from "../core/reservations/reservation.routes";
import { ticketRouter } from "../core/tickets/ticket.routes";
import { paymentRouter } from "../core/payments/payment.routes";
import { loginLimiter } from "../middlewares/rateLimit.middleware";
import { logger } from "../logger/logger";

const routes = (app: Express) => {
  // Swagger Ui route
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check route
  app.get("/health", (_req, res) => {
    res.status(200).send("OK");
  });

  // home route
  app.get("/", (_req, res) => {
    res.send("Ticket Reservation API is running");
  });

  // API routes

  if (process.env.NODE_ENV !== "test") {
    app.use("/api/V1/users/login", loginLimiter);
  }

  app.use("/api/V1/users", userRouter);
  app.use("/api/V1/events", eventRouter);
  app.use("/api/V1/reservations", reservationRouter);
  app.use("/api/V1/tickets", ticketRouter);
  app.use("/api/V1/payments", paymentRouter);
  //  Not found routed
  app.all("/*splat", () => {
    throw new NotFoundError("The requested page was not found.");
  });

  // TODO :

  // Error handler
  if (process.env.NODE_ENV == "deployment") {
    app.use(
      (err: unknown, _req: Request, _res: Response, next: NextFunction) => {
        logger.error(`RAW ERROR : ${err}`);
        next(err);
      },
    );
  }
  app.use(errorHandler);
};

export default routes;
