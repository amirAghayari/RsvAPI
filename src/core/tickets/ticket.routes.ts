import express from "express";
import { ticketController } from "..";
import { protect } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { updateTicketSchema } from "../../schemas/tickets-schema/updateTicket.schema";
import { cacheRoute } from "../../middlewares/cache.middleware";

const router = express.Router();

/******************************************************
 ************* PUBLIC ROUTES ***************************
 ******************************************************/

// Ticket Details
router.get(
  "/:id",
  cacheRoute(120),
  ticketController.findTicketById.bind(ticketController),
);

/******************************************************
 ************* AUTHENTICATED USER ROUTES ***************
 ******************************************************/

router.use(protect);

// Routes below are for authenticated users and ownership is checked in the service.
router.patch(
  "/:id",
  validate(updateTicketSchema),
  ticketController.updateTicket.bind(ticketController),
);

router.delete("/:id", ticketController.deleteTicket.bind(ticketController));

export { router as ticketRouter };
