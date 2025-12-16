import { Repository, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Event } from "../entities/event.entity";
import AppDataSource from "../config/dataSource";

// TODO : نامگذاری بهتر

// TODO : اسنترفیس
export interface EventListItem {
  id: string;
  name: string;
  totalCapacity: number;
  remainingTickets: number;
  executionDate: Date;
  salesStartTime: Date;
  buyButtonAvailable: boolean;
}

export class EventService {
  private eventRepository: Repository<Event>;

  constructor() {
    this.eventRepository = AppDataSource.getRepository(Event);
  }

  async findAllEvents(): Promise<EventListItem[]> {
    const now = new Date();

    const events = await this.eventRepository.find({
      where: {
        salesStartTime: LessThanOrEqual(now),
        remainingTickets: MoreThanOrEqual(1),
      },
      select: [
        "id",
        "name",
        "totalCapacity",
        "remainingTickets",
        "executionDate",
        "salesStartTime",
      ],
      // TODO : ببین اوردر برای چیه
      order: {
        executionDate: "ASC",
      },
    });

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      totalCapacity: event.totalCapacity,
      remainingTickets: event.remainingTickets,
      executionDate: event.executionDate,
      salesStartTime: event.salesStartTime,
      buyButtonAvailable: event.remainingTickets > 0,
    }));
  }

  // TODO : برای ادمین
  async createEvent(data: {
    name: string;
    capacity: number;
    executionDate: Date;
    salesStartTime: Date;
  }): Promise<Event> {
    const event = this.eventRepository.create({
      name: data.name,
      totalCapacity: data.capacity,
      remainingTickets: data.capacity,
      executionDate: data.executionDate,
      salesStartTime: data.salesStartTime,
    });
    return this.eventRepository.save(event);
  }
}
