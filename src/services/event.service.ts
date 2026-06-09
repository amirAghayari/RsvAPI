import { Repository } from "typeorm";
import { Event } from "../entities/event.entity";
import AppDataSource from "../config/dataSource";
import { IEvent } from "../utils/eventItems.interface";
import { AppError } from "../utils/AppError";
import { ReservationStatus } from "../utils/reservation.status";
import { NotFoundError } from "../errors/not-found-error";

export class EventService {
  private eventRepository: Repository<Event>;

  constructor() {
    this.eventRepository = AppDataSource.getRepository(Event);
  }
  async findAllEvents(): Promise<IEvent[]> {
    const now = new Date();

    const events = await this.eventRepository
      .createQueryBuilder("event")
      .leftJoin("event.reservations", "r", "r.status IN (:...statuses)", {
        statuses: [ReservationStatus.PAID, ReservationStatus.PENDING],
      })
      .select([
        "event.id AS id",
        "event.name AS name",
        "event.totalCapacity AS total_capacity",
        "event.executionDate AS execution_date",
        "event.salesStartTime AS sales_start_time",
        `
  GREATEST(
    event.totalCapacity - COALESCE(SUM(r.ticketCount), 0),
    0
  ) AS remaining_tickets
  `,
      ])
      .where("event.salesStartTime <= :now", { now })
      .groupBy("event.id")
      .orderBy("event.executionDate", "ASC")
      .getRawMany();

    if (!events) throw new NotFoundError("NO_EVENTS_FOUND");

    return events.map((e) => ({
      id: e.id,
      name: e.name,
      totalCapacity: Number(e.total_capacity),
      executionDate: e.execution_date,
      salesStartTime: e.sales_start_time,
      remainingTickets: Number(e.remaining_tickets),
      buyButtonAvailable: Number(e.remaining_tickets) > 0,
    }));
  }

  async createEvent(data: {
    name: string;
    capacity: number;
    executionDate: Date;
    salesStartTime: Date;
  }): Promise<Event> {
    const event = this.eventRepository.create({
      name: data.name,
      totalCapacity: data.capacity,
      executionDate: data.executionDate,
      salesStartTime: data.salesStartTime,
    });
    return this.eventRepository.save(event);
  }
}
