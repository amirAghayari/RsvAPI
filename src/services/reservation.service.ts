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
import { AppError } from "../controllers/reservation.controller";

// TODO : بررسی
export class ReservationService {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  // TODO : بقیه رو هم اینطوری کن
  private get repo() {
    return {
      event: AppDataSource.getRepository(Event),
      reservation: AppDataSource.getRepository(Reservation),
      user: AppDataSource.getRepository(User),
    };
  }

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
    } catch (err) {
      console.error("Failed to create log:", err);
    }
  }

  async createReservation(
    userId: string,
    validation: ReservationSchema,
    files: Express.Multer.File[]
  ): Promise<Reservation> {
    if (files.length !== validation.ticketCount) {
      throw new AppError("File count must match ticket count.", 400);
    }

    const uploadedImages = await Promise.all(
      files.map((file) =>
        this.uploadService.uploadFile(file.buffer, file.originalname)
      )
    );

    const ticketOwner: TicketOwner[] = validation.details.map(
      (detail, index) => ({
        fullName: detail.fullName,
        phoneNumber: detail.phoneNumber,
        picture: uploadedImages[index],
      })
    );

    return await AppDataSource.transaction(async (manager) => {
      const eventRepo = manager.getRepository(Event);
      const reservationRepo = manager.getRepository(Reservation);

      const event = await eventRepo
        .createQueryBuilder("event")
        .setLock("pessimistic_write")
        .where("event.id = :id", { id: validation.eventId })
        .getOne();

      if (!event) throw new AppError("EVENT_NOT_FOUND", 404);
      if (new Date() < event.salesStartTime)
        throw new AppError("SALES_NOT_STARTED", 409);

      const userCurrentTickets = await reservationRepo
        .createQueryBuilder("r")
        .where("r.userId = :userId", { userId })
        .andWhere("r.eventId = :eventId", { eventId: validation.eventId })
        .andWhere("r.status IN (:...statuses)", {
          statuses: ["pending", "paid"],
        })
        .select("SUM(r.ticketCount)", "sum")
        .getRawOne();

      const current = Number(userCurrentTickets.sum || 0);
      if (current + validation.ticketCount > 3) {
        throw new AppError("MAX_TICKETS_PER_USER_EXCEEDED", 400);
      }

      if (
        event.remainingTickets - event.blockedTickets <
        validation.ticketCount
      ) {
        throw new AppError("NOT_ENOUGH_TICKETS", 409);
      }

      event.blockedTickets += validation.ticketCount;
      await eventRepo.save(event);

      const reservation = reservationRepo.create({
        userId,
        eventId: validation.eventId,
        ticketCount: validation.ticketCount,
        ticketOwner,
        status: ReservationStatus.PENDING,
      });

      const saved = await reservationRepo.save(reservation);

      await this.logActionSafe(userId, LogAction.RESERVE, saved);

      return saved;
    });
  }

  async getUserReservations(userId: string) {
    return await this.repo.reservation.find({
      where: { userId },
      relations: ["event"],
      select: {
        id: true,
        ticketCount: true,
        ticketOwner: true,
        status: true,
        createdAt: true,
        event: {
          id: true,
          name: true,
          executionDate: true,
        },
      },
    });
  }

  async updateReservationStatus(
    reservationId: string,
    userId: string,
    newStatus: ReservationStatus
  ): Promise<Reservation> {
    return await AppDataSource.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(Reservation);
      const eventRepo = manager.getRepository(Event);

      const reservation = await reservationRepo.findOne({
        where: { id: reservationId, userId },
        relations: ["event"],
      });

      if (!reservation) throw new AppError("RESERVATION_NOT_FOUND", 404);
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new AppError("CAN_ONLY_MODIFY_PENDING_RESERVATIONS", 400);
      }

      if (newStatus === ReservationStatus.PAID) {
        reservation.status = newStatus;
      } else if (newStatus === ReservationStatus.CANCELED) {
        const event = await eventRepo
          .createQueryBuilder("event")
          .setLock("pessimistic_write")
          .where("event.id = :id", { id: reservation.eventId })
          .getOne();

        if (event) {
          event.blockedTickets -= reservation.ticketCount;
          await eventRepo.save(event);
        }
        reservation.status = newStatus;
      }

      const result = await reservationRepo.save(reservation);
      await this.logActionSafe(
        userId,
        newStatus === ReservationStatus.PAID ? LogAction.PAY : LogAction.CANCEL,
        result
      );
      return result;
    });
  }
}

export default new ReservationService();
