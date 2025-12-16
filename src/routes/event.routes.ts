import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { EventService } from "../services/Event.service";
// import { isAdmin } from '../middlewares/auth.middleware'; // فرض بر وجود میدل‌ور

const eventService = new EventService();
const eventController = new EventController(eventService);

const router = Router();

router.get("/", eventController.findAll);

// TODO : میدل‌ور ادمین
// router.post('/', authenticate, isAdmin, eventController.create); // روت محافظت شده
router.post("/", eventController.create); // فعلاً بدون محافظت برای تست آسان

export default router;
