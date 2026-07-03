import express from "express";
import { eventController, ticketController } from "..";
import { protect } from "../../middlewares/auth.middleware";
import { isAdmin } from "../../middlewares/admin.middleware";
import { validate } from "../../middlewares/validate.middleware";

import { createEventSchema } from "../../schemas/events-schema/createEven.schema";
import { updateEventSchema } from "../../schemas/events-schema/updateEventByAdmin.schema";

import { createTicketSchema } from "../../schemas/tickets-schema/createTicket.schema";

const router = express.Router();

/******************************************************
 ************* PUBLIC ROUTES ***************************
 ******************************************************/

router.get("/", eventController.findAllEvents.bind(eventController));

router.get("/:id", eventController.findEventById.bind(eventController));

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
  validate(createEventSchema),
  eventController.createEvent.bind(eventController),
);

// Create ticket for an event
router.post(
  "/:eventId/tickets",
  validate(createTicketSchema),
  ticketController.createTicket.bind(ticketController),
);

router.patch(
  "/:id",
  validate(updateEventSchema),
  eventController.updateEvent.bind(eventController),
);

router.delete("/:id", eventController.deleteEvent.bind(eventController));

export { router as eventRouter };
