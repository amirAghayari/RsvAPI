import { Express, NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./../swagger";
import AuthRouter from "./../routes/auth.routes";
import ReservationRouter from "./../routes/reservation.routes";
import EventRouter from "./../routes/event.routes";
import LogRouter from "./../routes/log.routes";
import rateLimit from "express-rate-limit";
import { AppError } from "./../utils/AppError";

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

  app.use("/api/V1/auth/login", loginLimiter);

  app.use("/api/V1/auth", AuthRouter);
  app.use("/api/V1/reservations", ReservationRouter);
  app.use("/api/V1/events", EventRouter);
  app.use("/api/V1/logs", LogRouter);

  // TODO : add code for not found pages :
  //  	app.all("*", () => {
  // throw new NotFoundError("صفحه مورد نظر یافت نشد");
  //	});

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
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  });
};

export default routes;
