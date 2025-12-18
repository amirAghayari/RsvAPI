import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { EventService } from "../services/Event.service";
import { authenticate } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";

const eventService = new EventService();
const eventController = new EventController(eventService);

const router = Router();

router.get("/", eventController.findAll);

// create event by admin
router.post("/", authenticate, isAdmin, eventController.create);

export default router;
