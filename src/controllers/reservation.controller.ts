import { Request, Response } from "express";
import { ReservationSchema } from "../schemas/reservation.schema";
import { ReservationService } from "../services/reservation.service";
import { ReservationStatus } from "../utils/reservation.status";

// TODO : بررسی
// تعریف اینترفیس برای جلوگیری از تکرار
interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; name?: string };
}

export class ReservationController {
  // اگر از Dependency Injection فریم‌ورک خاصی استفاده نمی‌کنید،
  // سرویس باید یا پاس داده شود یا ایمپورت شود.
  constructor(private reservationService: ReservationService) {}

  /**
   * نکته مهم: استفاده از Arrow Function (= async (...) =>)
   * باعث می‌شود context کلاس (this) حفظ شود.
   */
  createReservation = async (req: AuthenticatedRequest, res: Response) => {
    // بهتر است از لایبرری‌هایی مثل class-validator یا zod برای چک کردن req.body استفاده کنید
    // casting به تنهایی داده را چک نمی‌کند.
    const validation = req.body as ReservationSchema;
    const files = req.files as Express.Multer.File[];
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "AUTHENTICATION_REQUIRED" });
    }

    // اعتبارسنجی ساده فایل
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
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

  // تبدیل به Arrow Function برای رفع مشکل this
  getMyReservations = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "UNAUTHORIZED" });

    try {
      // دریافت پارامترهای pagination از کوئری
      const take = Number(req.query.take) || 20;
      const skip = Number(req.query.skip) || 0;

      const reservations = await this.reservationService.getUserReservations(
        userId,
        take,
        skip
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

  // متد کمکی داخلی
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

  /**
   * مدیریت خطای متمرکز
   * این متد باعث می‌شود کدهای تکراری try-catch در کنترلر کاهش یابد
   * و وابستگی به متن خطاها یکجا مدیریت شود.
   */
  private handleError(res: Response, error: any) {
    console.error("Controller Error:", error);

    const msg = error.message || "";

    // مپینگ خطاها به Status Code
    // پیشنهاد: در سرویس از کلاس‌های خطای اختصاصی (AppError) استفاده کنید تا اینجا مجبور به چک کردن string نباشید
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
