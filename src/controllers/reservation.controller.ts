import { Request, Response } from "express";
import { ReservationSchema } from "../schemas/reservation.schema";
import { ReservationService } from "../services/reservation.service";
import { ReservationStatus } from "../utils/reservation.status";

interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; name?: string };
}

// TODO : اینو به فایل جداگونه ای ببر
export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  private handleStatusUpdate = async (
    req: AuthenticatedRequest,
    res: Response,
    status: ReservationStatus
  ) => {
    const userId = req.user?.id;
    const { reservationId } = req.params;

    if (!userId) return res.status(401).json({ message: "UNAUTHORIZED" });

    try {
      const updated = await this.reservationService.updateReservationStatus(
        reservationId,
        userId,
        status
      );

      return res.json({
        message: `Reservation ${status.toLowerCase()} successfully`,
        data: updated,
      });
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  createReservation = async (req: AuthenticatedRequest, res: Response) => {
    const validation = req.body as ReservationSchema;
    const files = req.files as Express.Multer.File[];
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "AUTHENTICATION_REQUIRED" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "NO_FILE_UPLOADED" });
    }

    try {
      const newReservation = await this.reservationService.createReservation(
        userId,
        validation,
        files
      );

      return res.status(201).json({
        message: "Reservation created successfully.",
        data: {
          reservationId: newReservation.id,
          status: newReservation.status,
        },
      });
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getMyReservations = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "UNAUTHORIZED" });

    try {
      const reservations = await this.reservationService.getUserReservations(
        userId
      );
      return res.json({ data: reservations });
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  cancelReservation = async (req: AuthenticatedRequest, res: Response) => {
    return this.handleStatusUpdate(req, res, ReservationStatus.CANCELED);
  };

  payReservation = async (req: AuthenticatedRequest, res: Response) => {
    return this.handleStatusUpdate(req, res, ReservationStatus.PAID);
  };

  private handleError(res: Response, error: any) {
    console.error("Controller Error:", error);

    const msg = error.message || "";

    if (msg.includes("NOT_FOUND") || msg.includes("not found")) {
      return res.status(404).json({ message: msg });
    }
    if (
      msg.includes("NOT_ENOUGH_TICKETS") ||
      msg.includes("SALES_NOT_STARTED")
    ) {
      return res.status(409).json({ message: msg }); // Conflict
    }

    if (msg.includes("CAN_ONLY_MODIFY_PENDING")) {
      return res.status(400).json({ message: msg });
    }

    return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
  }
}
