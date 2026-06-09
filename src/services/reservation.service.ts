import { Repository } from "typeorm";
import AppDataSource from "../config/dataSource";
import { Reservation } from "../entities/reservation.entity";
import { Event } from "../entities/event.entity";
import { User } from "../core/users/user.entity";
import { UploadService } from "./upload.service";
import LogService from "./log.service";
import { AppError } from "../utils/AppError";
import { ReservationSchema } from "../schemas/reservation.schema";
import { LogAction, ReservationStatus } from "../utils/reservation.status";
import { TicketOwner } from "../utils/ticketOwner.interface";
import { NotFoundError } from "../errors/not-found-error";

const MAX_TICKETS_PER_USER = 3;

export class ReservationService {
  private reservationRepo: Repository<Reservation>;
  // private eventRepo: Repository<Event>;
  private userRepo: Repository<User>;
  private uploadService = new UploadService();

  constructor() {
    this.reservationRepo = AppDataSource.getRepository(Reservation);
    // this.eventRepo = AppDataSource.getRepository(Event);
    this.userRepo = AppDataSource.getRepository(User);
  }

  private async calculateRemainingTickets(eventId: string): Promise<number> {
    const eventRepo = AppDataSource.getRepository(Event);

    const event = await eventRepo.findOne({
      where: { id: eventId },
      select: ["totalCapacity"],
    });

    if (!event) {
      throw new NotFoundError("EVENT_NOT_FOUND");
    }

    const reservedTickets = await this.reservationRepo
      .createQueryBuilder("r")
      .select("COALESCE(SUM(r.ticketCount), 0)", "total")
      .where("r.eventId = :eventId", { eventId })
      .andWhere("r.status IN (:...statuses)", {
        statuses: [ReservationStatus.PAID, ReservationStatus.PENDING],
      })
      .getRawOne();

    const reservedCount = Number(reservedTickets.total);
    const remaining = event.totalCapacity - reservedCount;

    return Math.max(0, remaining);
  }

  private async logActionSafe(
    userId: string,
    action: LogAction,
    reservation: Reservation,
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
        },
      );
    } catch (err) {
      console.error("LOG_FAILED", err);
    }
  }

  private async validateUserTicketLimit(
    userId: string,
    eventId: string,
    requested: number,
    repo: Repository<Reservation>,
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
    files: Express.Multer.File[],
  ): Promise<Reservation> {
    if (files.length !== dto.ticketCount) {
      throw new AppError("FILE_COUNT_MISMATCH", 400);
    }

    const remainingTickets = await this.calculateRemainingTickets(dto.eventId);

    if (remainingTickets < dto.ticketCount)
      throw new AppError("NOT_ENOUGH_TICKETS", 409);

    // upload BEFORE transaction
    // const uploadedFiles = await this.uploadService.uploadMany(
    //   files,
    //   userId,
    //   dto.eventId
    // );

    let uploadedFiles: string[] = [];

    try {
      return await AppDataSource.transaction(async (manager) => {
        const eventRepo = manager.getRepository(Event);
        const reservationRepo = manager.getRepository(Reservation);

        const event = await eventRepo
          .createQueryBuilder("event")
          .setLock("pessimistic_write")
          .where("event.id = :id", { id: dto.eventId })
          .getOne();

        if (!event) throw new NotFoundError("EVENT_NOT_FOUND");
        if (new Date() < event.salesStartTime)
          throw new AppError("SALES_NOT_STARTED", 409);

        await this.validateUserTicketLimit(
          userId,
          dto.eventId,
          dto.ticketCount,
          reservationRepo,
        );

        uploadedFiles = await this.uploadService.uploadMany(
          files,
          userId,
          dto.eventId,
        );

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

        const updatedRemaining = await this.calculateRemainingTickets(
          dto.eventId,
        );

        await this.logActionSafe(userId, LogAction.RESERVE, saved);

        return {
          ...saved,
          event: {
            ...event,
            remainingTickets: updatedRemaining,
          },
        } as Reservation;
      });
    } catch (err) {
      if (uploadedFiles.length > 0) {
        // rollback uploaded files
        await this.uploadService.removeMany(uploadedFiles);
      }
      throw err;
    }
  }

  async updateReservationStatus(
    reservationId: string,
    userId: string,
    newStatus: ReservationStatus,
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

      if (!reservation) throw new NotFoundError("RESERVATION_NOT_FOUND");
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new AppError("INVALID_STATUS_TRANSITION", 400);
      }

      if (newStatus === ReservationStatus.PAID) {
        reservation.status = ReservationStatus.PAID;
      }

      if (newStatus === ReservationStatus.CANCELED) {
        reservation.status = ReservationStatus.CANCELED;
      }

      await eventRepo.save(reservation.event);
      const result = await reservationRepo.save(reservation);

      const remainingTickets = await this.calculateRemainingTickets(
        result.eventId,
      );

      await this.logActionSafe(
        userId,
        newStatus === ReservationStatus.PAID ? LogAction.PAY : LogAction.CANCEL,
        result,
      );

      return {
        ...result,
        event: {
          ...result.event,
          remainingTickets,
        },
      } as Reservation;
    });
  }

  async getUserReservations(userId: string) {
    const reservations = await this.reservationRepo.find({
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
          totalCapacity: true,
        },
      },
    });

    const reservationsWithRemaining = await Promise.all(
      reservations.map(async (reservation) => {
        return {
          ...reservation,
          event: {
            ...reservation.event,
          },
        };
      }),
    );

    return reservationsWithRemaining;
  }
}

export default new ReservationService();
