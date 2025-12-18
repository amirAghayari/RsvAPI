import { Repository } from "typeorm";
import AppDataSource from "../config/dataSource";
import { Reservation } from "../entities/reservation.entity";
import { Event } from "../entities/event.entity";
import { User } from "../entities/user.entity";
import { UploadService } from "./upload.service";
import LogService from "./log.service";
import { AppError } from "../utils/AppError";
import { ReservationSchema } from "../schemas/reservation.schema";
import { LogAction, ReservationStatus } from "../utils/reservation.status";
import { TicketOwner } from "../utils/ticketOwner.interface";

const MAX_TICKETS_PER_USER = 3;

export class ReservationService {
  private reservationRepo: Repository<Reservation>;
  private eventRepo: Repository<Event>;
  private userRepo: Repository<User>;
  private uploadService = new UploadService();

  constructor() {
    this.reservationRepo = AppDataSource.getRepository(Reservation);
    this.eventRepo = AppDataSource.getRepository(Event);
    this.userRepo = AppDataSource.getRepository(User);
  }

  private async logActionSafe(
    userId: string,
    action: LogAction,
    reservation: Reservation
  ) {
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ["email"],
      });

      await LogService.createLog(
        user?.email ?? "unknown",
        action,
        reservation.eventId,
        reservation.status,
        {
          reservationId: reservation.id,
          ticketCount: reservation.ticketCount,
        }
      );
    } catch (err) {
      console.error("LOG_FAILED", err);
    }
  }

  private async validateUserTicketLimit(
    userId: string,
    eventId: string,
    requested: number,
    repo: Repository<Reservation>
  ) {
    const result = await repo
      .createQueryBuilder("r")
      .select("COALESCE(SUM(r.ticketCount),0)", "sum")
      .where("r.userId = :userId", { userId })
      .andWhere("r.eventId = :eventId", { eventId })
      .andWhere("r.status IN (:...statuses)", {
        statuses: [ReservationStatus.PENDING, ReservationStatus.PAID],
      })
      .getRawOne();

    if (Number(result.sum) + requested > MAX_TICKETS_PER_USER) {
      throw new AppError("MAX_TICKETS_PER_USER_EXCEEDED", 400);
    }
  }

  async createReservation(
    userId: string,
    dto: ReservationSchema,
    files: Express.Multer.File[]
  ): Promise<Reservation> {
    if (files.length !== dto.ticketCount) {
      throw new AppError("FILE_COUNT_MISMATCH", 400);
    }

    // upload BEFORE transaction
    const uploadedFiles = await this.uploadService.uploadMany(
      files,
      userId,
      dto.eventId
    );

    try {
      return await AppDataSource.transaction(async (manager) => {
        const eventRepo = manager.getRepository(Event);
        const reservationRepo = manager.getRepository(Reservation);

        const event = await eventRepo
          .createQueryBuilder("event")
          .setLock("pessimistic_write")
          .where("event.id = :id", { id: dto.eventId })
          .getOne();

        if (!event) throw new AppError("EVENT_NOT_FOUND", 404);
        if (new Date() < event.salesStartTime)
          throw new AppError("SALES_NOT_STARTED", 409);
        if (event.remainingTickets < dto.ticketCount)
          throw new AppError("NOT_ENOUGH_TICKETS", 409);

        await this.validateUserTicketLimit(
          userId,
          dto.eventId,
          dto.ticketCount,
          reservationRepo
        );

        event.remainingTickets -= dto.ticketCount;
        event.blockedTickets += dto.ticketCount;
        await eventRepo.save(event);

        const ticketOwner: TicketOwner[] = dto.details.map((d, i) => ({
          fullName: d.fullName,
          phoneNumber: d.phoneNumber,
          picture: uploadedFiles[i],
        }));

        const reservation = reservationRepo.create({
          userId,
          eventId: dto.eventId,
          ticketCount: dto.ticketCount,
          ticketOwner,
          status: ReservationStatus.PENDING,
        });

        const saved = await reservationRepo.save(reservation);
        await this.logActionSafe(userId, LogAction.RESERVE, saved);

        return saved;
      });
    } catch (err) {
      // rollback uploaded files
      await this.uploadService.removeMany(uploadedFiles);
      throw err;
    }
  }

  async updateReservationStatus(
    reservationId: string,
    userId: string,
    newStatus: ReservationStatus
  ): Promise<Reservation> {
    return AppDataSource.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(Reservation);
      const eventRepo = manager.getRepository(Event);

      const reservation = await reservationRepo
        .createQueryBuilder("reservation")
        .innerJoinAndSelect("reservation.event", "event")
        .where("reservation.id = :id AND reservation.userId = :userId", {
          id: reservationId,
          userId,
        })
        .setLock("pessimistic_write")
        .getOne();

      if (!reservation) throw new AppError("RESERVATION_NOT_FOUND", 404);
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new AppError("INVALID_STATUS_TRANSITION", 400);
      }

      if (newStatus === ReservationStatus.PAID) {
        reservation.status = ReservationStatus.PAID;
        reservation.event.blockedTickets -= reservation.ticketCount;
        reservation.event.soldTickets += reservation.ticketCount;
      }

      if (newStatus === ReservationStatus.CANCELED) {
        reservation.status = ReservationStatus.CANCELED;
        reservation.event.blockedTickets -= reservation.ticketCount;
        reservation.event.remainingTickets += reservation.ticketCount;
      }

      await eventRepo.save(reservation.event);
      const result = await reservationRepo.save(reservation);

      await this.logActionSafe(
        userId,
        newStatus === ReservationStatus.PAID ? LogAction.PAY : LogAction.CANCEL,
        result
      );

      return result;
    });
  }

  async getUserReservations(userId: string) {
    return this.reservationRepo.find({
      where: { userId },
      relations: ["event"],
      order: { createdAt: "DESC" },
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
}

export default new ReservationService();
