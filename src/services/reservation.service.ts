import { Repository } from "typeorm";
import { ReservationStatus } from "../utils/reservation.status";
import { UploadService } from "./upload.service";
import { Reservation } from "../entities/reservation.entity";
import { Event } from "../entities/event.entity";
import AppDataSource from "../config/dataSource";
import { ReservationSchema } from "../schemas/reservation.schema";

// TODO
export interface TicketDetailItem {
  fullName: string;
  phoneNumber: string;
  picture: string;
}

export class ReservationService {
  private eventRepository: Repository<Event>;
  private reservationRepository: Repository<Reservation>;
  private uploadService: UploadService;

  constructor() {
    this.eventRepository = AppDataSource.getRepository(Event);
    this.reservationRepository = AppDataSource.getRepository(Reservation);
    this.uploadService = new UploadService();
  }

  async createReservation(
    userId: string,
    validation: ReservationSchema,
    files: Express.Multer.File[]
  ): Promise<Reservation> {
    if (files.length !== validation.ticketCount) {
      throw new Error("File count must match ticket count.");
    }

    return AppDataSource.manager.transaction(async (entityManager) => {
      const eventRepo = entityManager.getRepository(Event);
      const reservationRepo = entityManager.getRepository(Reservation);

      // TODO :Read here
      const event = await eventRepo
        .createQueryBuilder("event")
        .setLock("pessimistic_write")
        .where("event.id = :id", { id: validation.eventId })
        .getOne();

      if (!event) throw new Error("Event not found.");

      if (event.remainingTickets < validation.ticketCount) {
        throw new Error("NOT_ENOUGH_TICKETS");
      }
      if (new Date() < event.salesStartTime) {
        throw new Error("TICKET_SALES_NOT_STARTED");
      }

      const ticketDetails: TicketDetailItem[] = await Promise.all(
        validation.details.map(async (detail, index) => {
          const file = files[index];
          const fileUrl = await this.uploadService.uploadFile(
            file.buffer,
            file.originalname
          );

          return {
            fullName: detail.fullName,
            phoneNumber: detail.phoneNumber,
            picture: fileUrl,
          };
        })
      );

      const reservation = reservationRepo.create({
        userId: userId,
        eventId: event.id,
        ticketCount: validation.ticketCount,
        status: ReservationStatus.PENDING,
        ticketDetails: ticketDetails,
        createdAt: new Date(),
      });

      event.remainingTickets -= validation.ticketCount;

      await reservationRepo.save(reservation);
      await eventRepo.save(event);

      return reservation;
    });
  }
}
