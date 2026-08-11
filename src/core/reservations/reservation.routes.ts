import express from "express";
import { reservationController } from "..";
import { protect } from "../../middlewares/auth.middleware";
import { isAdmin } from "../../middlewares/admin.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createReservationSchema } from "../../schemas/reservations-schema/createReservation.schema";

const router = express.Router();

router.use(protect);

/******************************************************
 ************* USER ROUTES *****************************
 ******************************************************/

router.post(
  "/",
  validate(createReservationSchema),
  reservationController.createReservation.bind(reservationController),
);

// Logged-in user's reservations
router.get(
  "/me",
  reservationController.getMyReservations.bind(reservationController),
);

// Reservation details
router.get(
  "/:id",
  reservationController.getReservationById.bind(reservationController),
);

// Cancel reservation
router.patch(
  "/:id/cancel",
  reservationController.cancelReservation.bind(reservationController),
);

/******************************************************
 ************* ADMIN ROUTES ****************************
 ******************************************************/

router.use(isAdmin);

// All reservations
router.get(
  "/",
  reservationController.getAllReservations.bind(reservationController),
);

// Reservations by status
router.get(
  "/status/:status",
  reservationController.getReservationsByStatus.bind(reservationController),
);

// Delete reservation
router.delete(
  "/:id",
  reservationController.deleteReservation.bind(reservationController),
);

export { router as reservationRouter };
