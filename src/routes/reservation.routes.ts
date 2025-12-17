import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { ReservationController } from "../controllers/reservation.controller";
import { ReservationService } from "../services/reservation.service";
import { validateBody } from "../middlewares/body.validate";
import { CreateReservationSchema } from "../schemas/reservation.schema";

const reservationService = new ReservationService();
const reservationController = new ReservationController(reservationService);

const router = Router();

router.post(
  "/",
  authenticate,
  [],
  validateBody(CreateReservationSchema),
  reservationController.createReservation
);

router.get("/my", authenticate, reservationController.getMyReservations);

router.patch(
  "/:reservationId/cancel",
  authenticate,
  reservationController.cancelReservation
);

router.patch(
  "/:reservationId/pay",
  authenticate,
  reservationController.payReservation
);

export default router;
