import { Router } from "express";
import { LogController } from "../controllers/log.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";

const logController = new LogController();
const router = Router();

router.get("/", authenticate, isAdmin, logController.getLogs);

export default router;
