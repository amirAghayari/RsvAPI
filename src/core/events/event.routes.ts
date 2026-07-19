import express from "express";
import { eventController, ticketController } from "..";
import { protect } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { cacheRoute } from "../../middlewares/cache.middleware";

import { createEventSchema } from "../../schemas/events-schema/createEven.schema";
import { updateEventSchema } from "../../schemas/events-schema/updateEvent.schema";

import { createTicketSchema } from "../../schemas/tickets-schema/createTicket.schema";

const router = express.Router();

/******************************************************
 ************* PUBLIC ROUTES ***************************
 ******************************************************/

router.get(
  "/",
  cacheRoute(120),
  eventController.findAllEvents.bind(eventController),
);

router.get(
  "/:id",
  cacheRoute(120),
  eventController.findEventById.bind(eventController),
);

// Get tickets of an event
router.get(
  "/:eventId/tickets",
  ticketController.findTicketsByEventId.bind(ticketController),
);

/******************************************************
 ************* AUTHENTICATED USER ROUTES ***************
 ******************************************************/

router.use(protect);

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
