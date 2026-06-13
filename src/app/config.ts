import express, { Express } from "express";
import cors from "cors";

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import ms from "ms";
import { User } from "../core/users/user.entity";
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const morgan = require("morgan");

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

const config = (app: Express) => {
  // Development Logging
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Set security HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        },
      },
    }),
  );

  // CORS configuration
  const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies to be sent with requests
  };
  app.use(cors(corsOptions));

  // Limit requests
  const limiter = rateLimit({
    windowMs: ms("15m"),
    limit: 100,
    message: "Your IP requests are too high, please try again in an hour!",
  });
  if (process.env.NODE === "production") app.use("/api", limiter);

  // Request's Body parser
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: false }));
  // Request's Cookie parser
  app.use(cookieParser());

  // Protect against HTTP Parameter Pollution attacks
  //TODO : Add whitelist
  app.use(
    hpp({
      whitelist: [
        // "countInStock",
        // "brand",
        // "category",
        // "rating",
        // "numReviews",
      ],
    }),
  );
};

export default config;
