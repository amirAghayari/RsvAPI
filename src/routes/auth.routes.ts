import express from "express";
import { validateBody } from "../middlewares/validate.middleware";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "../schemas/auth.schema";
import { login, refresh, register } from "../controllers/auth.controller";

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);

router.post("/login", validateBody(loginSchema), login);

router.post("/refresh", validateBody(refreshSchema), refresh);

export default router;
