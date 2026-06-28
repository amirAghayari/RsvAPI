import { DataSource, EntityManager, Repository } from "typeorm";
import { Reservation } from "./reservation.entity";
import APIFeatures from "../../utils/apiFeatures";
import { ICreateReservationDto } from "./dtos/create-reservation.dto";
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
    const feature = new APIFeatures<Reservation>(this.repo(manager), query);

    feature.filter().sort().search().limitFields();

    const { pagination, total, skip } = await feature.pagination();

    const reservations = await feature.execute();

    return { pagination, skip, total, reservations };
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

    if (select && select.length) queryOption.select = select;
    if (relations && relations.length) queryOption.relations = relations;

    const reservation = await this.repo(manager).findOne(queryOption);

    return reservation;
  }

  async findByUserId(
    userId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
      order?: Record<string, string>;
    },
    manager?: EntityManager,
  ): Promise<Reservation | null> {
    const { select, relations, order } = option || {};

    const queryOption: any = {
      where: { userId },
    };

    if (select && select.length) queryOption.select = select;
    if (relations && relations.length) queryOption.relations = relations;
    if (order && order.length) queryOption.order = order;

    const reservation = await this.repo(manager).findOne(queryOption);

    return reservation;
  }

  async findByEventId(
    eventId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
      order?: Record<string, string>;
    },
    manager?: EntityManager,
  ): Promise<Reservation | null> {
    const { select, relations, order } = option || {};

    const queryOption: any = {
      where: { eventId },
    };

    if (select && select.length) queryOption.select = select;
    if (relations && relations.length) queryOption.relations = relations;
    if (order && order.length) queryOption.order = order;

    const reservation = await this.repo(manager).findOne(queryOption);

    return reservation;
  }

  async findByUserAndEventId(
    userId: string,
    eventId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
      order?: Record<string, string>;
    },
    manager?: EntityManager,
  ): Promise<Reservation | null> {
    const { select, relations, order } = option || {};

    const queryOption: any = {
      where: { eventId, userId },
    };

    if (select && select.length) queryOption.select = select;
    if (relations && relations.length) queryOption.relations = relations;
    if (order && order.length) queryOption.order = order;

    const reservation = await this.repo(manager).findOne(queryOption);

    return reservation;
  }

  async countByEvent(
    eventId: string,
    manager?: EntityManager,
  ): Promise<number> {
    return await this.repo(manager).count({
      where: { eventId },
    });
  }

  async existsReservation(
    userId: string,
    eventId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return await this.repo(manager).exists({
      where: { userId, eventId },
    });
  }

  async findExpiredReservations(
    manager?: EntityManager,
  ): Promise<Reservation[]> {
    return await this.repo(manager).find({
      where: {
        status: ReservationStatus.EXPIRED,
      },
    });
  }
  async findPendingReservations(
    manager?: EntityManager,
  ): Promise<Reservation[]> {
    return await this.repo(manager).find({
      where: {
        status: ReservationStatus.PENDING,
      },
    });
  }
  async findConfirmedReservations(
    manager?: EntityManager,
  ): Promise<Reservation[]> {
    return await this.repo(manager).find({
      where: {
        status: ReservationStatus.CONFIRMED,
      },
    });
  }
  /*************************************************************
   ************* @description CREATE OPERATIONS ****************
   *************************************************************/

  async createReservation(
    createReservationDto: ICreateReservationDto,
    manager?: EntityManager,
  ): Promise<Reservation> {
    const newReservation = this.repo(manager).create(createReservationDto);
    return await this.saveReservation(newReservation, manager);
  }

  /************************************************************
   ************* @description UPDATE OPERATIONS ***************
   ************************************************************/
  async updateReservation(
    id: string,
    updateReservationDto: IUpdateReservationDto,
    manager?: EntityManager,
  ): Promise<Reservation | null> {
    const result = await this.repo(manager).update(id, updateReservationDto);
    if (result.affected === 0) {
      throw new NotFoundError(`Event with id ${id} not found`);
    }
    const updatedReservation = await this.findById(id, undefined, manager);
    if (!updatedReservation) {
      throw new NotFoundError(
        `Reservation with id ${id} not found after update`,
      );
    }

    return updatedReservation;
  }

  async updateReservationStatus(
    id: string,
    status: ReservationStatus,
    manager?: EntityManager,
  ): Promise<void> {
    await this.repo(manager).update(id, { status });
  }
  /************************************************************
   ************* @description DELETE OPERATIONS ***************
   ************************************************************/
  async deleteReservation(
    id: string,
    manager?: EntityManager,
  ): Promise<{ success: boolean; message: string }> {
    const reservation = await this.repo(manager).findOne({ where: { id } });

    if (!reservation) {
      throw new NotFoundError(`Reservation with id ${id} not found`);
    }

    await this.repo(manager).remove(reservation);

    return {
      success: true,
      message: `Reservation with id ${id} deleted successfully`,
    };
  }
}
