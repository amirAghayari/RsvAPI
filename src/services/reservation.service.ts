import { Repository, EntityManager } from "typeorm";
import { LogAction, ReservationStatus } from "../utils/reservation.status";
import { UploadService } from "./upload.service";
import { Reservation } from "../entities/reservation.entity";
import { Event } from "../entities/event.entity";
import { User } from "../entities/user.entity";
import AppDataSource from "../config/dataSource";
import { ReservationSchema } from "../schemas/reservation.schema";
import { TicketOwner } from "../utils/ticketOwner.interface";
import LogService from "./log.service";

// TODO : بررسی
export class ReservationService {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  // Helper برای دسترسی امن به ریپازیتوری
  private get repo() {
    return {
      event: AppDataSource.getRepository(Event),
      reservation: AppDataSource.getRepository(Reservation),
      user: AppDataSource.getRepository(User),
    };
  }

  /** ایجاد رزرو جدید */
  async createReservation(
    userId: string,
    validation: ReservationSchema,
    files: Express.Multer.File[]
  ): Promise<Reservation> {
    if (files.length !== validation.ticketCount) {
      throw new Error("File count must match ticket count.");
    }

    // 1. آپلود فایل‌ها قبل از شروع تراکنش (جلوگیری از قفل طولانی دیتابیس)
    // نکته: اگر تراکنش شکست بخورد، فایل‌های آپلود شده "یتیم" می‌شوند که باید توسط یک CronJob پاک شوند
    // یا اینجا در بلوک catch حذف شوند.
    const uploadedImages = await Promise.all(
      files.map((file) =>
        this.uploadService.uploadFile(file.buffer, file.originalname)
      )
    );

    const ticketOwner: TicketOwner[] = validation.details.map(
      (detail, index) => ({
        fullName: detail.fullName,
        phoneNumber: detail.phoneNumber,
        picture: uploadedImages[index], // فرض بر تطابق ایندکس (بهتر است مکانیزم دقیق‌تری داشته باشید)
      })
    );

    let savedReservation: Reservation;

    try {
      // 2. شروع تراکنش دیتابیس
      savedReservation = await AppDataSource.manager.transaction(
        async (entityManager: EntityManager) => {
          const eventRepo = entityManager.getRepository(Event);
          const reservationRepo = entityManager.getRepository(Reservation);

          // قفل pessimistic
          const event = await eventRepo
            .createQueryBuilder("event")
            .setLock("pessimistic_write")
            .where("event.id = :id", { id: validation.eventId })
            .getOne();

          if (!event) throw new Error("EVENT_NOT_FOUND");

          // بررسی‌های منطقی
          if (event.remainingTickets < validation.ticketCount) {
            throw new Error("NOT_ENOUGH_TICKETS");
          }
          if (new Date() < event.salesStartTime) {
            throw new Error("TICKET_SALES_NOT_STARTED");
          }

          // ایجاد آبجکت رزرو
          const reservation = reservationRepo.create({
            userId,
            eventId: event.id,
            ticketCount: validation.ticketCount,
            status: ReservationStatus.PENDING,
            ticketOwner,
            createdAt: new Date(),
          });

          // کاهش موجودی
          event.remainingTickets -= validation.ticketCount;

          // ذخیره‌سازی اتمیک
          await eventRepo.save(event);
          return await reservationRepo.save(reservation);
        }
      );
    } catch (error) {
      // TODO: در اینجا می‌توان فایل‌های آپلود شده را حذف کرد تا فضای سرور اشغال نشود
      throw error;
    }

    // 3. لاگ‌گیری (Fire and Forget یا جدا از تراکنش اصلی)
    // عدم استفاده از await یا هندل کردن خطای آن تاثیری روی خرید کاربر نگذارد
    this.logActionSafe(userId, LogAction.RESERVE, savedReservation);

    return savedReservation;
  }

  async getUserReservations(
    userId: string,
    take: number = 20,
    skip: number = 0
  ): Promise<Reservation[]> {
    return this.repo.reservation.find({
      where: { userId },
      relations: ["event"],
      select: {
        id: true,
        ticketCount: true,
        status: true,
        ticketOwner: true,
        createdAt: true,
        event: {
          id: true,
          name: true,
          executionDate: true,
        },
      },
      order: { createdAt: "DESC" },
      take,
      skip,
    });
  }

  async updateReservationStatus(
    reservationId: string,
    userId: string,
    newStatus: ReservationStatus
  ): Promise<Reservation> {
    const result = await AppDataSource.manager.transaction(
      async (entityManager) => {
        const reservationRepo = entityManager.getRepository(Reservation);
        const eventRepo = entityManager.getRepository(Event);

        const reservation = await reservationRepo.findOne({
          where: { id: reservationId, userId },
          relations: ["event"], // برای دسترسی به eventId
        });

        if (!reservation) throw new Error("RESERVATION_NOT_FOUND");
        if (reservation.status !== ReservationStatus.PENDING) {
          throw new Error("CAN_ONLY_MODIFY_PENDING_RESERVATIONS");
        }

        // اگر کنسل شد، موجودی را برگردان
        if (newStatus === ReservationStatus.CANCELED) {
          const event = await eventRepo
            .createQueryBuilder("event")
            .setLock("pessimistic_write") // قفل برای جلوگیری از Race Condition در بازگشت موجودی
            .where("event.id = :id", { id: reservation.eventId })
            .getOne();

          if (event) {
            event.remainingTickets += reservation.ticketCount;
            await eventRepo.save(event);
          }
        }

        reservation.status = newStatus;
        return await reservationRepo.save(reservation);
      }
    );

    // لاگ‌گیری خارج از تراکنش
    const action =
      newStatus === ReservationStatus.CANCELED
        ? LogAction.CANCEL
        : LogAction.PAY;
    this.logActionSafe(userId, action, result);

    return result;
  }

  // متد کمکی برای لاگ امن
  private async logActionSafe(
    userId: string,
    action: LogAction,
    reservation: Reservation
  ) {
    try {
      const user = await this.repo.user.findOne({
        where: { id: userId },
        select: ["email"],
      });
      await LogService.createLog(
        user?.email || "unknown",
        action,
        reservation.eventId,
        reservation.status,
        { ticketCount: reservation.ticketCount, reservationId: reservation.id }
      );
    } catch (e) {
      console.error("Failed to create log:", e);
      // خطا را پرتاب نمی‌کنیم تا روند اصلی مختل نشود
    }
  }
}

export default new ReservationService();
