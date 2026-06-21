import express from "express";
import { isAdmin } from "../../middlewares/admin.middleware";
import { eventController } from "..";
import { protect } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createEventByAdminSchema } from "../../schemas/events-schema/createEventByAdmin.schema";
import { updateEventByAdminSchema } from "../../schemas/events-schema/updateEventByAdmin.schema";
import { deleteEventByAdminSchema } from "../../schemas/events-schema/deleteEventByAdmin.schema";
import { getEventByIdSchema } from "../../schemas/events-schema/getEventById.schema";

const router = express.Router();

router.get("/", eventController.findAllEvents.bind(eventController));
router.get("/:id", [
  validate(getEventByIdSchema),
  eventController.findEventById.bind(eventController),
]);
// TODO : Think about whether only admins can send the following requests or all users
router.use(protect, isAdmin);

router.post("/", [
  validate(createEventByAdminSchema),
  eventController.createEvent.bind(eventController),
]);

router
  .route("/:id")
  .patch([
    validate(updateEventByAdminSchema),
    eventController.findEventById.bind(eventController),
  ])
  .delete([
    validate(deleteEventByAdminSchema),
    eventController.deleteEvent.bind(eventController),
  ]);

export { router as eventRouter };
