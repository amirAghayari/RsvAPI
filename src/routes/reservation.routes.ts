import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { ReservationController } from "../controllers/reservation.controller";
import { ReservationService } from "../services/reservation.service";
import { validateBody } from "../middlewares/validate.middleware";
import { CreateReservationSchema } from "../schemas/reservation.schema";
import multer from "multer";
import path from "node:path";

const reservationService = new ReservationService();
const reservationController = new ReservationController(reservationService);

// get files by multer
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadPath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      "national-cards",
    );
    cb(null, uploadPath);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `card-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("ONLY_JPG_PNG_ALLOWED"));
    }
  },
});

const router = Router();

router.post(
  "/",
  authenticate,
  upload.array("pictures", 3),
  validateBody(CreateReservationSchema),
  reservationController.createReservation,
);

router.get("/my", authenticate, reservationController.getMyReservations);

router.patch(
  "/:reservationId/cancel",
  authenticate,
  reservationController.cancelReservation,
);

router.patch(
  "/:reservationId/pay",
  authenticate,
  reservationController.payReservation,
);

export default router;
