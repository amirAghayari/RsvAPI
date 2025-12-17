import { Repository } from "typeorm";
import { Log } from "../entities/log.entity";
import AppDataSource from "../config/dataSource";
import { Event } from "../entities/event.entity";
import { LogAction } from "../utils/reservation.status";

// TODO : بررسی
export class LogService {
  private logRepository: Repository<Log>;
  private eventRepository: Repository<Event>;

  constructor() {
    this.logRepository = AppDataSource.getRepository(Log);
    this.eventRepository = AppDataSource.getRepository(Event);
  }

  async createLog(
    userEmail: string,
    action: LogAction,
    eventId: string | null,
    status: string,
    details?: any
  ): Promise<Log> {
    const log = this.logRepository.create({
      userEmail,
      action,
      eventId: eventId || null,
      status,
      details,
    });
    return this.logRepository.save(log);
  }

  async getLogs(filters: {
    userEmail?: string;
    eventId?: string | null;
    status?: string;
    fromDate?: string; // ISO string
    toDate?: string; // ISO string
    minSoldTickets?: number; // n
  }): Promise<Log[]> {
    const query = this.logRepository.createQueryBuilder("log");

    if (filters.userEmail) {
      query.andWhere("log.userEmail ILIKE :userEmail", {
        userEmail: `%${filters.userEmail}%`,
      });
    }

    if (filters.eventId) {
      query.andWhere("log.eventId = :eventId", { eventId: filters.eventId });
    }

    if (filters.status) {
      query.andWhere("log.status = :status", { status: filters.status });
    }

    if (filters.fromDate) {
      query.andWhere("log.timestamp >= :fromDate", {
        fromDate: filters.fromDate,
      });
    }

    if (filters.toDate) {
      query.andWhere("log.timestamp <= :toDate", { toDate: filters.toDate });
    }

    // برای فیلتر minSoldTickets: جوین با event و چک فروش
    if (filters.minSoldTickets !== undefined) {
      query
        .innerJoin(Event, "event", "event.id = log.eventId")
        .andWhere("(event.totalCapacity - event.remainingTickets) > :minSold", {
          minSold: filters.minSoldTickets,
        });
    }

    return query.orderBy("log.timestamp", "DESC").getMany();
  }
}

export default new LogService();
