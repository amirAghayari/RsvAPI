import { DataSource } from "typeorm";

import { Payment } from "../payment.entity";
import { PaymentRepository } from "../payment.repository";
import { ReservationRepository } from "../../reservations/reservation.repository";
import { TicketRepository } from "../../tickets/ticket.repository";
import { UserRepository } from "../../users/user.repository";

import { NotFoundError } from "../../../errors/not-found-error";
import { BadRequestError } from "../../../errors/bad-request-error";

import { PaymentStatus } from "../../../utils/payment.status";
import { ReservationStatus } from "../../../utils/reservation.status";

import { ICreatePaymentDto } from "../dtos/create-payment.dto";

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly ticketRepository: TicketRepository,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
    // private readonly zarinpalService: ZarinpalService,
  ) {}

  /******************************************************
   ************* GET HANDLERS ***************************
   ******************************************************/

  async getAllPayments(query: any) {
    const { pagination, skip, total, payments } =
      await this.paymentRepository.findAll(query);

    if (query.page && skip >= total) {
      throw new NotFoundError("This page does not exist.");
    }

    return {
      pagination,
      payments,
    };
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      throw new NotFoundError("Payment not found.");
    }

    return payment;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError(`User with this id ${userId} not found`);
    }
    return await this.paymentRepository.findByUserId(userId);
  }

  /******************************************************
   ************* CREATE PAYMENT *************************
   ******************************************************/

  async createPayment(
    userId: string,
    dto: ICreatePaymentDto,
  ): Promise<{ paymentUrl: string }> {
    return this.dataSource.transaction(async (manager) => {
      const reservation = await this.reservationRepository.findByIdForUpdate(
        dto.reservationId,
        manager,
      );

      if (!reservation) {
        throw new NotFoundError("Reservation not found.");
      }

      if (reservation.userId !== userId) {
        throw new BadRequestError("Access denied.");
      }

      if (reservation.status === ReservationStatus.PAID) {
        throw new BadRequestError("Reservation already paid.");
      }

      if (reservation.status === ReservationStatus.CANCELED) {
        throw new BadRequestError("Reservation canceled.");
      }

      if (reservation.status === ReservationStatus.EXPIRED) {
        throw new BadRequestError("Reservation expired.");
      }

      const exists = await this.paymentRepository.existsPaymentByReservation(
        reservation.id,
        manager,
      );

      if (exists) {
        throw new BadRequestError("A pending payment already exists.");
      }

      const ticket = await this.ticketRepository.findById(
        reservation.ticketId,
        undefined,
        manager,
      );

      if (!ticket) {
        throw new NotFoundError("Ticket not found.");
      }

      const amount = ticket.price * reservation.quantity;

      const payment = await this.paymentRepository.createPayment(
        {
          reservationId: reservation.id,
          userId,
          amount,
        },
        manager,
      );

      // TODO
      const gateway = await this.zarinpalService.requestPayment({
        amount,
        paymentId: payment.id,
        description: `Ticket Reservation #${reservation.id}`,
      });

      payment.authority = gateway.authority;

      await this.paymentRepository.savePayment(payment, manager);

      return {
        paymentUrl: gateway.paymentUrl,
      };
    });
  }

  /******************************************************
   ************* VERIFY PAYMENT *************************
   ******************************************************/

  async verifyPayment(authority: string, status: string): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      if (status !== "OK") {
        throw new BadRequestError("Payment was canceled by user.");
      }

      const payment = await this.paymentRepository.findByAuthority(
        authority,
        undefined,
        manager,
      );

      if (!payment) {
        throw new NotFoundError("Payment not found.");
      }

      if (payment.status === PaymentStatus.SUCCESS) {
        return payment;
      }

      const verify = await this.zarinpalService.verifyPayment({
        authority,
        amount: payment.amount,
      });

      if (!verify.success) {
        payment.status = PaymentStatus.FAILED;

        await this.paymentRepository.savePayment(payment, manager);

        return payment;
      }

      payment.status = PaymentStatus.SUCCESS;
      payment.refId = verify.refId;
      payment.cardPan = verify.cardPan;
      payment.fee = verify.fee;
      payment.feeType = verify.feeType;
      payment.paidAt = new Date();

      await this.paymentRepository.savePayment(payment, manager);

      const reservation = await this.reservationRepository.findByIdForUpdate(
        payment.reservationId,
        manager,
      );

      if (!reservation) {
        throw new NotFoundError("Reservation not found.");
      }

      reservation.status = ReservationStatus.PAID;

      await this.reservationRepository.saveReservation(reservation, manager);

      return payment;
    });
  }

  /******************************************************
   ************* DELETE ********************************
   ******************************************************/

  async deletePayment(id: string): Promise<void> {
    await this.getPaymentById(id);

    await this.paymentRepository.deletePayment(id);
  }
}
