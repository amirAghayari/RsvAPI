import { Request, Response } from "express";
import { ReservationSchema } from "../schemas/reservation.schema";
import { ReservationService } from "../services/reservation.service";

// TODO
interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; name?: string };
}

export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  createReservation = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response> => {
    const validation: ReservationSchema = req.body;

    const files = req.files as Express.Multer.File[];
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "AUTHENTICATION_REQUIRED" });
    }

    try {
      const newReservation = await this.reservationService.createReservation(
        userId,
        validation,
        files
      );

      return res.status(201).json({
        message: "Reservation created successfully. Awaiting payment.",
        reservationId: newReservation.id,
        status: newReservation.status,
      });
    } catch (error: any) {
      console.error("Reservation Error:", error.message);
      if (
        error.message.includes("not found") ||
        error.message.includes("sales have not started")
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Not enough tickets")) {
        return res.status(409).json({ message: error.message }); // Conflict
      }
      return res
        .status(500)
        .json({ message: "Internal server error during reservation." });
    }
  };
}
