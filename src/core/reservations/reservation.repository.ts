import { DataSource, Repository } from "typeorm";
import { Reservation } from "./reservation.entity";
import APIFeatures from "../../utils/apiFeatures";

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

    const reservation = await feature.execute();

    return { pagination, skip, total, reservation };
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

  // TODO : update , create , delete
}
