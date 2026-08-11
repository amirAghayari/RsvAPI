import { DataSource, EntityManager, Repository } from "typeorm";
import APIFeatures from "../../utils/apiFeatures";
import { NotFoundError } from "../../errors/not-found-error";

import { Payment } from "./payment.entity";
import { PaymentStatus } from "./payment.status";
import { ICreatePaymentDto } from "./dtos/create-payment.dto";
import { IUpdatePaymentDto } from "./dtos/update-payment.dto";

export class PaymentRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager): Repository<Payment> {
    return (manager ?? this.dataSource.manager).getRepository(Payment);
  }

  async savePayment(
    payment: Payment,
    manager?: EntityManager,
  ): Promise<Payment> {
    return await this.repo(manager).save(payment);
  }

  /********************************************************
   ************* @description READ OPERATIONS *************
   ********************************************************/

  async findAll(query: any, manager?: EntityManager) {
    const features = new APIFeatures<Payment>(this.repo(manager), query);

    features.filter().sort().search().limitFields();

    const { pagination, total, skip } = await features.pagination();

    const payments = await features.execute();

    return {
      pagination,
      total,
      skip,
      payments,
    };
  }

  async findById(
    id: string,
    option?: {
      select?: (keyof Payment)[];
      relations?: string[];
    },
    manager?: EntityManager,
  ): Promise<Payment | null> {
    const { select, relations } = option || {};

    const queryOption: any = {
      where: { id },
    };

    if (select?.length) queryOption.select = select;
    if (relations?.length) queryOption.relations = relations;

    return await this.repo(manager).findOne(queryOption);
  }

  async findByAuthority(
    authority: string,
    option?: {
      select?: (keyof Payment)[];
      relations?: string[];
    },
    manager?: EntityManager,
  ): Promise<Payment | null> {
    const { select, relations } = option || {};

    const queryOption: any = {
      where: { authority },
    };

    if (select?.length) queryOption.select = select;
    if (relations?.length) queryOption.relations = relations;

    return await this.repo(manager).findOne(queryOption);
  }

  async findByReservationId(
    reservationId: string,
    option?: {
      select?: (keyof Payment)[];
      relations?: string[];
    },
    manager?: EntityManager,
  ): Promise<Payment | null> {
    const { select, relations } = option || {};

    const queryOption: any = {
      where: { reservationId },
    };

    if (select?.length) queryOption.select = select;
    if (relations?.length) queryOption.relations = relations;

    return await this.repo(manager).findOne(queryOption);
  }

  async findByUserId(
    userId: string,
    option?: {
      select?: (keyof Payment)[];
      relations?: string[];
      order?: Record<string, "ASC" | "DESC">;
    },
    manager?: EntityManager,
  ): Promise<Payment[]> {
    const { select, relations, order } = option || {};

    const queryOption: any = {
      where: { userId },
    };

    if (select?.length) queryOption.select = select;
    if (relations?.length) queryOption.relations = relations;
    if (order) queryOption.order = order;

    return await this.repo(manager).find(queryOption);
  }

  async findPaymentsByStatus(
    status: PaymentStatus,
    manager?: EntityManager,
  ): Promise<Payment[]> {
    return await this.repo(manager).find({
      where: {
        status,
      },
    });
  }

  async findByIdForUpdate(
    id: string,
    manager: EntityManager,
  ): Promise<Payment | null> {
    return await manager
      .getRepository(Payment)
      .createQueryBuilder("payment")
      .setLock("pessimistic_write")
      .where("payment.id = :id", { id })
      .getOne();
  }

  async existsPaymentByReservation(
    reservationId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return await this.repo(manager).exists({
      where: {
        reservationId,
        status: PaymentStatus.PENDING,
      },
    });
  }
  /*************************************************************
   ************* @description CREATE OPERATIONS ****************
   *************************************************************/

  async createPayment(
    data: ICreatePaymentDto,
    manager?: EntityManager,
  ): Promise<Payment> {
    const payment = this.repo(manager).create(data);

    return await this.savePayment(payment, manager);
  }

  /************************************************************
   ************* @description UPDATE OPERATIONS ***************
   ************************************************************/

  async updatePayment(
    id: string,
    payload: IUpdatePaymentDto,
    manager?: EntityManager,
  ): Promise<Payment | null> {
    const result = await this.repo(manager).update(id, payload);

    if (result.affected === 0) {
      throw new NotFoundError(`Payment with id ${id} not found.`);
    }

    const updatedPayment = await this.findById(id, undefined, manager);

    if (!updatedPayment) {
      throw new NotFoundError(`Payment with id ${id} not found after update.`);
    }

    return updatedPayment;
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    manager?: EntityManager,
  ): Promise<void> {
    await this.repo(manager).update(id, {
      status,
    });
  }

  /************************************************************
   ************* @description DELETE OPERATIONS ***************
   ************************************************************/

  async deletePayment(
    id: string,
    manager?: EntityManager,
  ): Promise<{ success: boolean; message: string }> {
    const payment = await this.findById(id, undefined, manager);

    if (!payment) {
      throw new NotFoundError(`Payment with id ${id} not found.`);
    }

    await this.repo(manager).remove(payment);

    return {
      success: true,
      message: `Payment with id ${id} deleted successfully.`,
    };
  }
}
