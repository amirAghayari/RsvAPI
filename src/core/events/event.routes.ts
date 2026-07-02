import express from "express";
import { eventController, ticketController } from "..";
import { protect } from "../../middlewares/auth.middleware";
import { isAdmin } from "../../middlewares/admin.middleware";
import { validate } from "../../middlewares/validate.middleware";

import { createEventByAdminSchema } from "../../schemas/events-schema/createEventByAdmin.schema";
import { updateEventByAdminSchema } from "../../schemas/events-schema/updateEventByAdmin.schema";
import { deleteEventByAdminSchema } from "../../schemas/events-schema/deleteEventByAdmin.schema";
import { getEventByIdSchema } from "../../schemas/events-schema/getEventById.schema";

const router = express.Router();

/******************************************************
 ************* PUBLIC ROUTES ***************************
 ******************************************************/

router.get("/", eventController.findAllEvents.bind(eventController));

router.get(
  "/:id",
  validate(getEventByIdSchema),
  eventController.findEventById.bind(eventController),
);

// Get tickets of an event
router.get(
  "/:eventId/tickets",
  ticketController.findTicketsByEventId.bind(ticketController),
);

/******************************************************
 ************* ADMIN ROUTES ****************************
 ******************************************************/

router.use(protect, isAdmin);

router.post(
  "/",
  validate(createEventByAdminSchema),
  eventController.createEvent.bind(eventController),
);

// Create ticket for an event
router.post(
  "/:eventId/tickets",
  ticketController.createTicket.bind(ticketController),
);

router.patch(
  "/:id",
  validate(updateEventByAdminSchema),
  eventController.updateEvent.bind(eventController),
);

router.delete(
  "/:id",
  validate(deleteEventByAdminSchema),
  eventController.deleteEvent.bind(eventController),
);

export { router as eventRouter };
