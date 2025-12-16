import express from "express";
import * as dotenv from "dotenv";
import AppDataSource from "./config/dataSource";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from Ticket Reservation API!");
});

// auth routes
import authRouter from "./controllers/auth.controller";
import { authenticate } from "./middlewares/auth.middleware";

app.use("/auth", authRouter);

// protected example
app.get("/me", authenticate, (req, res) => {
  const user = (req as any).user;
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
