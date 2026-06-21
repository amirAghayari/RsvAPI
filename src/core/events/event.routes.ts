import express from "express";
import { isAdmin } from "../../middlewares/admin.middleware";
import { eventController } from "..";
import { protect } from "../../middlewares/auth.middleware";

const router = express.Router();

router.get("/", eventController.findAllEvents.bind(eventController));
router.get("/:id", eventController.findEventById.bind(eventController));

router.use(protect, isAdmin);

//TODO : add zod schema

router.post("/", eventController.createEvent.bind(eventController));

router
  .route("/:id")
  .patch(eventController.findEventById.bind(eventController))
  .delete(eventController.deleteEvent.bind(eventController));

export { router as eventRouter };
