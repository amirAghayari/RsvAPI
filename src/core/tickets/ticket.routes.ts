import express from "express";
import { ticketController } from "..";
import { protect } from "../../middlewares/auth.middleware";
import { isAdmin } from "../../middlewares/admin.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { updateTicketSchema } from "../../schemas/tickets-schema/updateTicket.schema";

const router = express.Router();

/******************************************************
 ************* PUBLIC ROUTES ***************************
 ******************************************************/

// Ticket Details
router.get("/:id", ticketController.findTicketById.bind(ticketController));

/******************************************************
 ************* ADMIN ROUTES ****************************
 ******************************************************/

router.use(protect, isAdmin);

// Get all tickets (Admin Dashboard)
router.get("/", ticketController.findAllTickets.bind(ticketController));

router.patch("/:id", [
  validate(updateTicketSchema),
  ticketController.updateTicket.bind(ticketController),
]);

router.delete("/:id", ticketController.deleteTicket.bind(ticketController));

export { router as ticketRouter };
