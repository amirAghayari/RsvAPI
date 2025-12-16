import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { ReservationController } from "../controllers/reservation.controller";
import { ReservationService } from "../services/reservation.service";
import { validateBody } from "../middlewares/body.validate";
import { CreateReservationSchema } from "../schemas/reservation.schema";
// TODO : نامگذاری بهتر

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

export default router;
