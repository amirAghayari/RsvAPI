import { DataSource, Repository } from "typeorm";
import { Reservation } from "./reservation.entity";
import APIFeatures from "../../utils/apiFeatures";
import { ICreateReservationDto } from "./dtos/create-reservation.dto";
import { IUpdateReservationDto } from "./dtos/update-reservation.dto";
import { NotFoundError } from "../../errors/not-found-error";
import { ReservationStatus } from "../../utils/reservation.status";

export class ReservationRepository extends Repository<Reservation> {
  constructor(dataSource: DataSource) {
    super(Reservation, dataSource.manager);
  }

  async saveReservation(reservation: Reservation): Promise<Reservation> {
    return this.manager.save(reservation);
  }

  /********************************************************
   ************* @description READ OPERATIONS *************
   ********************************************************/

  async findAll(query: any) {
    const feature = new APIFeatures<Reservation>(this, query);

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
  ): Promise<Reservation | null> {
    const { select, relations } = option || {};

    const queryOption: any = {
      where: { id },
    };

    if (select && select.length) queryOption.select = select;
    if (relations && relations.length) queryOption.relations = relations;

    const reservation = await this.findOne(queryOption);

    return reservation;
  }

  async findByUserId(
    userId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
      order?: Record<string, string>;
    },
  ): Promise<Reservation | null> {
    const { select, relations, order } = option || {};

    const queryOption: any = {
      where: { userId },
    };

    if (select && select.length) queryOption.select = select;
    if (relations && relations.length) queryOption.relations = relations;
    if (order && order.length) queryOption.order = order;

    const reservation = await this.findOne(queryOption);

    return reservation;
  }

  async findByEventId(
    eventId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
      order?: Record<string, string>;
    },
  ): Promise<Reservation | null> {
    const { select, relations, order } = option || {};

    const queryOption: any = {
      where: { eventId },
    };

    if (select && select.length) queryOption.select = select;
    if (relations && relations.length) queryOption.relations = relations;
    if (order && order.length) queryOption.order = order;

    const reservation = await this.findOne(queryOption);

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
  ): Promise<Reservation | null> {
    const { select, relations, order } = option || {};

    const queryOption: any = {
      where: { eventId, userId },
    };

    if (select && select.length) queryOption.select = select;
    if (relations && relations.length) queryOption.relations = relations;
    if (order && order.length) queryOption.order = order;

    const reservation = await this.findOne(queryOption);

    return reservation;
  }

  async countByEvent(eventId: string): Promise<number> {
    return await this.count({
      where: { eventId },
    });
  }

  async existsReservation(userId: string, eventId: string): Promise<boolean> {
    return await this.exists({
      where: { userId, eventId },
    });
  }

  async findExpiredReservations(): Promise<Reservation[]> {
    return await this.find({
      where: {
        status: ReservationStatus.EXPIRED,
      },
    });
  }
  async findPendingReservations(): Promise<Reservation[]> {
    return await this.find({
      where: {
        status: ReservationStatus.PENDING,
      },
    });
  }
  async findConfirmedReservations(): Promise<Reservation[]> {
    return await this.find({
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
  ): Promise<Reservation> {
    return this.create(createReservationDto);
  }

  /************************************************************
   ************* @description UPDATE OPERATIONS ***************
   ************************************************************/
  async updateReservation(
    id: string,
    updateReservationDto: IUpdateReservationDto,
  ): Promise<Reservation | null> {
    const result = await this.update(id, updateReservationDto);
    if (result.affected === 0) {
      throw new NotFoundError(`Event with id ${id} not found`);
    }
    const updatedReservation = await this.findById(id);
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
  ): Promise<void> {
    await this.update(id, { status });
  }
  /************************************************************
   ************* @description DELETE OPERATIONS ***************
   ************************************************************/
  async deleteReservation(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const reservation = await this.findOne({ where: { id } });

    if (!reservation) {
      throw new NotFoundError(`Reservation with id ${id} not found`);
    }

    await this.remove(reservation);

    return {
      success: true,
      message: `Reservation with id ${id} deleted successfully`,
    };
  }
}
