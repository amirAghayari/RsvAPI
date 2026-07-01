import {
  DataSource,
  DeepPartial,
  EntityManager,
  LessThan,
  Repository,
} from "typeorm";
import APIFeatures from "../../utils/apiFeatures";
import { Reservation } from "./reservation.entity";
import { IUpdateReservationDto } from "./dtos/update-reservation.dto";
import { NotFoundError } from "../../errors/not-found-error";
import { ReservationStatus } from "../../utils/reservation.status";

export class ReservationRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager): Repository<Reservation> {
    return (manager ?? this.dataSource.manager).getRepository(Reservation);
  }

  async saveReservation(
    reservation: Reservation,
    manager?: EntityManager,
  ): Promise<Reservation> {
    return await this.repo(manager).save(reservation);
  }

  /********************************************************
   ************* @description READ OPERATIONS *************
   ********************************************************/

  async findAll(query: any, manager?: EntityManager) {
    const features = new APIFeatures<Reservation>(this.repo(manager), query);

    features.filter().sort().search().limitFields();

    const { pagination, total, skip } = await features.pagination();

    const reservations = await features.execute();

    return {
      pagination,
      total,
      skip,
      reservations,
    };
  }

  async findById(
    id: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
    },
    manager?: EntityManager,
  ): Promise<Reservation | null> {
    const { select, relations } = option || {};

    const queryOption: any = {
      where: { id },
    };

    if (select?.length) queryOption.select = select;
    if (relations?.length) queryOption.relations = relations;

    return await this.repo(manager).findOne(queryOption);
  }

  // Used inside transactions
  async findByIdForUpdate(
    id: string,
    manager: EntityManager,
  ): Promise<Reservation | null> {
    return await manager
      .getRepository(Reservation)
      .createQueryBuilder("reservation")
      .setLock("pessimistic_write")
      .where("reservation.id = :id", { id })
      .getOne();
  }

  async findByUserId(
    userId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
      order?: Record<string, "ASC" | "DESC">;
    },
    manager?: EntityManager,
  ): Promise<Reservation[]> {
    const { select, relations, order } = option || {};

    const queryOption: any = {
      where: { userId },
    };

    if (select?.length) queryOption.select = select;
    if (relations?.length) queryOption.relations = relations;
    if (order) queryOption.order = order;

    return await this.repo(manager).find(queryOption);
  }

  async findByTicketId(
    ticketId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
      order?: Record<string, "ASC" | "DESC">;
    },
    manager?: EntityManager,
  ): Promise<Reservation[]> {
    const { select, relations, order } = option || {};

    const queryOption: any = {
      where: { ticketId },
    };

    if (select?.length) queryOption.select = select;
    if (relations?.length) queryOption.relations = relations;
    if (order) queryOption.order = order;

    return await this.repo(manager).find(queryOption);
  }

  async findByUserAndTicketId(
    userId: string,
    ticketId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
    },
    manager?: EntityManager,
  ): Promise<Reservation | null> {
    const { select, relations } = option || {};

    const queryOption: any = {
      where: {
        userId,
        ticketId,
      },
    };

    if (select?.length) queryOption.select = select;
    if (relations?.length) queryOption.relations = relations;

    return await this.repo(manager).findOne(queryOption);
  }

  async findPendingReservation(
    userId: string,
    ticketId: string,
    manager?: EntityManager,
  ): Promise<Reservation | null> {
    return await this.repo(manager).findOne({
      where: {
        userId,
        ticketId,
        status: ReservationStatus.PENDING,
      },
    });
  }

  async existsReservation(
    userId: string,
    ticketId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return await this.repo(manager).exists({
      where: {
        userId,
        ticketId,
      },
    });
  }

  async countByTicket(
    ticketId: string,
    manager?: EntityManager,
  ): Promise<number> {
    return await this.repo(manager).count({
      where: {
        ticketId,
      },
    });
  }

  async findReservationsByStatus(
    status: ReservationStatus,
    manager?: EntityManager,
  ): Promise<Reservation[]> {
    return await this.repo(manager).find({
      where: {
        status,
      },
    });
  }

  async findExpiredReservations(
    manager?: EntityManager,
  ): Promise<Reservation[]> {
    return await this.repo(manager).find({
      where: {
        status: ReservationStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
    });
  }

  /********************************************************
   ************* @description CREATE OPERATIONS ***********
   ********************************************************/

  async createReservation(
    data: DeepPartial<Reservation>,
    manager?: EntityManager,
  ): Promise<Reservation> {
    const reservation = this.repo(manager).create(data);

    return await this.saveReservation(reservation, manager);
  }

  /********************************************************
   ************* @description UPDATE OPERATIONS ***********
   ********************************************************/

  async updateReservation(
    id: string,
    payload: IUpdateReservationDto,
    manager?: EntityManager,
  ): Promise<Reservation> {
    const result = await this.repo(manager).update(id, payload);

    if (!result.affected) {
      throw new NotFoundError(`Reservation with id ${id} not found.`);
    }

    const updatedReservation = await this.findById(id, undefined, manager);

    if (!updatedReservation) {
      throw new NotFoundError(`Reservation with id ${id} not found.`);
    }

    return updatedReservation;
  }

  async updateReservationStatus(
    id: string,
    status: ReservationStatus,
    manager?: EntityManager,
  ): Promise<void> {
    const result = await this.repo(manager).update(id, {
      status,
    });

    if (!result.affected) {
      throw new NotFoundError(`Reservation with id ${id} not found.`);
    }
  }

  /********************************************************
   ************* @description DELETE OPERATIONS ***********
   ********************************************************/

  async deleteReservation(
    id: string,
    manager?: EntityManager,
  ): Promise<{ success: boolean; message: string }> {
    const reservation = await this.findById(id, undefined, manager);

    if (!reservation) {
      throw new NotFoundError(`Reservation with id ${id} not found.`);
    }

    await this.repo(manager).remove(reservation);

    return {
      success: true,
      message: `Reservation with id ${id} deleted successfully.`,
    };
  }
}
