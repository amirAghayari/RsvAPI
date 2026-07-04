import { DataSource, EntityManager } from "typeorm";
import { NotFoundError } from "../../../errors/not-found-error";
import { UserRepository } from "../../users/user.repository";

import { Reservation } from "../reservation.entity";
import { ReservationRepository } from "../reservation.repository";
import { DuplicateError } from "../../../errors/duplicate-error";
import { BadRequestError } from "../../../errors/bad-request-error";
import { EventStatus } from "../../../utils/event.status";
import { ReservationStatus } from "../../../utils/reservation.status";
import { TicketRepository } from "../../tickets/ticket.repository";
import { EventRepository } from "../../events/event.repository";

export class ReservationService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly userRepository: UserRepository,
    private readonly eventRepository: EventRepository,
    private readonly ticketRepository: TicketRepository,
    private readonly dataSource: DataSource,
  ) {}

  /******************************************************
   ************* @description GET HANDLERS *************
   ******************************************************/

  async getAllReservations(
    query: any,
  ): Promise<{ pagination: any; reservations: Reservation[] }> {
    const { pagination, skip, total, reservations } =
      await this.reservationRepository.findAll(query);
    if (query.page && skip >= total) {
      throw new NotFoundError("This page does not exist.");
    }

    return { pagination, reservations };
  }

  async getReservationsByStatus(
    status: ReservationStatus,
  ): Promise<Reservation[]> {
    return await this.reservationRepository.findReservationsByStatus(status);
  }

  async getReservationById(
    id: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
    },
  ): Promise<Reservation | null> {
    const targetReservation = await this.reservationRepository.findById(
      id,
      option,
    );

    if (!targetReservation) {
      throw new NotFoundError(`Reservations with this id : ${id} not found.`);
    }

    return targetReservation;
  }

  async getReservationByUserId(
    userId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
    },
  ): Promise<Reservation[] | null> {
    const user = await this.userRepository.findById(userId);

    const targetReservation = await this.reservationRepository.findByUserId(
      userId,
      option,
    );

    if (!user) {
      throw new NotFoundError(`User with this id : ${userId} not found.`);
    }

    if (!targetReservation) {
      throw new NotFoundError(
        `No reservations were found for this user with this ID : ${userId}.`,
      );
    }

    return targetReservation;
  }

  async getReservationByTicketId(
    ticketId: string,
    option: {
      select?: (keyof Reservation)[];
      relations?: string[];
    },
  ): Promise<Reservation[] | null> {
    const ticket = await this.ticketRepository.findById(ticketId);

    const targetReservation = await this.reservationRepository.findByTicketId(
      ticketId,
      option,
    );

    if (!ticket) {
      throw new NotFoundError(`Ticket with this id : ${ticketId} not found.`);
    }

    if (!targetReservation) {
      throw new NotFoundError(
        `No reservations were found for this event with this ID : ${ticketId}.`,
      );
    }

    return targetReservation;
  }

  async getReservationByUserAndTicketId(
    userId: string,
    ticketId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
    },
  ): Promise<Reservation | null> {
    const ticket = await this.ticketRepository.findById(ticketId);
    const user = await this.userRepository.findById(userId);

    const targetReservation =
      await this.reservationRepository.findByUserAndTicketId(
        userId,
        ticketId,
        option,
      );

    if (!ticket) {
      throw new NotFoundError(`Ticket with this id : ${ticketId} not found.`);
    }
    if (!user) {
      throw new NotFoundError(`User with this id : ${userId} not found.`);
    }

    if (!targetReservation) {
      throw new NotFoundError(
        `No reservations were found for this ticket with this ID : ${ticketId} and user with this ID : ${userId}.`,
      );
    }

    return targetReservation;
  }

  async reservationIsExists(
    userId: string,
    ticketId: string,
  ): Promise<boolean> {
    const ticket = await this.ticketRepository.findById(ticketId);
    const user = await this.userRepository.findById(userId);

    const exists: boolean = await this.reservationRepository.existsReservation(
      userId,
      ticketId,
    );

    if (!ticket) {
      throw new NotFoundError(`Ticket with this id : ${ticketId} not found.`);
    }
    if (!user) {
      throw new NotFoundError(`User with this id : ${userId} not found.`);
    }

    return exists;
  }

  async validateReservationForPayment(
    reservationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<Reservation> {
    const reservation = manager
      ? await this.reservationRepository.findByIdForUpdate(
          reservationId,
          manager,
        )
      : await this.reservationRepository.findById(reservationId, {
          relations: ["ticket"],
        });

    if (!reservation) {
      throw new NotFoundError(
        `Reservation with id ${reservationId} not found.`,
      );
    }

    /******************************************************
     ******************** OWNERSHIP ***********************
     ******************************************************/

    if (reservation.userId !== userId) {
      throw new BadRequestError(
        "You are not allowed to pay for this reservation.",
      );
    }

    /******************************************************
     ********************* STATUS *************************
     ******************************************************/

    switch (reservation.status) {
      case ReservationStatus.CONFIRMED:
        throw new BadRequestError("Reservation has already been paid.");

      case ReservationStatus.CANCELED:
        throw new BadRequestError("Reservation has been canceled.");

      case ReservationStatus.EXPIRED:
        throw new BadRequestError("Reservation has expired.");
    }

    /******************************************************
     ******************** EXPIRE TIME *********************
     ******************************************************/

    if (reservation.expiresAt && reservation.expiresAt < new Date()) {
      throw new BadRequestError(
        "Reservation has expired. Please reserve again.",
      );
    }

    return reservation;
  }

  /******************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/

  async createReservation(
    userId: string,
    ticketId: string,
    quantity: number,
  ): Promise<Reservation> {
    return await this.dataSource.transaction(async (manager) => {
      /******************************************************
       ******************** USER *****************************
       ******************************************************/

      const user = await this.userRepository.findById(
        userId,
        undefined,
        manager,
      );

      if (!user) {
        throw new NotFoundError(`User with id ${userId} not found.`);
      }

      /******************************************************
       ******************* TICKET ****************************
       ******************************************************/

      const ticket = await this.ticketRepository.findByIdForUpdate(
        ticketId,
        manager,
      );

      if (!ticket) {
        throw new NotFoundError(`Ticket with id ${ticketId} not found.`);
      }

      /******************************************************
       ******************** EVENT ****************************
       ******************************************************/

      const event = await this.eventRepository.findById(
        ticket.eventId,
        undefined,
        manager,
      );

      if (!event) {
        throw new NotFoundError("Event not found.");
      }

      if (
        event.status === EventStatus.CANCELED ||
        event.status === EventStatus.FINISHED
      ) {
        throw new BadRequestError("Event is not available.");
      }

      /******************************************************
       ******************** VALIDATION ***********************
       ******************************************************/

      if (event.status !== EventStatus.PUBLISHED) {
        throw new BadRequestError(
          "This event is not available for reservation.",
        );
      }

      const now = new Date();

      if (ticket.saleStartsAt > now) {
        throw new BadRequestError("Ticket sale has not started yet.");
      }

      if (ticket.saleEndsAt < now) {
        throw new BadRequestError("Ticket sale has ended.");
      }

      if (quantity <= 0) {
        throw new BadRequestError("Quantity must be greater than zero.");
      }

      if (quantity > ticket.maxPerUser) {
        throw new BadRequestError(
          `Maximum ${ticket.maxPerUser} tickets can be reserved.`,
        );
      }

      const available = ticket.capacity - ticket.reservedCount;

      if (available < quantity) {
        throw new BadRequestError("Not enough ticket capacity available.");
      }

      /******************************************************
       ************ DUPLICATE RESERVATION ********************
       ******************************************************/

      const activeReservation =
        await this.reservationRepository.findPendingReservation(
          userId,
          ticketId,
          manager,
        );

      if (activeReservation) {
        throw new DuplicateError(
          "You already have a pending reservation for this ticket.",
        );
      }

      /******************************************************
       **************** UPDATE TICKET ************************
       ******************************************************/

      ticket.reservedCount += quantity;

      await this.ticketRepository.saveTicket(ticket, manager);

      /******************************************************
       *************** CREATE RESERVATION ********************
       ******************************************************/

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const reservation = await this.reservationRepository.createReservation(
        {
          userId,
          ticketId,
          quantity,
          status: ReservationStatus.PENDING,
          expiresAt,
        },
        manager,
      );

      return reservation;
    });
  }

  /******************************************************
   ************* @description Patch HANDLERS *************
   ******************************************************/

  async cancelReservation(
    reservationId: string,
    userId: string,
  ): Promise<Reservation> {
    return await this.dataSource.transaction(async (manager) => {
      /******************************************************
       **************** LOCK RESERVATION *********************
       ******************************************************/

      const reservation = await this.reservationRepository.findByIdForUpdate(
        reservationId,
        manager,
      );

      if (!reservation) {
        throw new NotFoundError(
          `Reservation with id ${reservationId} not found.`,
        );
      }

      /******************************************************
       ******************** OWNERSHIP ***********************
       ******************************************************/

      if (reservation.userId !== userId) {
        throw new BadRequestError(
          "You are not allowed to cancel this reservation.",
        );
      }

      /******************************************************
       ******************** VALIDATION **********************
       ******************************************************/

      switch (reservation.status) {
        case ReservationStatus.CANCELED:
          throw new BadRequestError("Reservation already canceled.");

        case ReservationStatus.EXPIRED:
          throw new BadRequestError("Reservation already expired.");

        case ReservationStatus.CONFIRMED:
          throw new BadRequestError("Paid reservations cannot be canceled.");
      }

      /******************************************************
       ********************* TICKET *************************
       ******************************************************/

      const ticket = await this.ticketRepository.findByIdForUpdate(
        reservation.ticketId,
        manager,
      );

      if (!ticket) {
        throw new NotFoundError(
          `Ticket with id ${reservation.ticketId} not found.`,
        );
      }

      /******************************************************
       **************** RELEASE CAPACITY ********************
       ******************************************************/

      ticket.reservedCount -= reservation.quantity;

      if (ticket.reservedCount < 0) {
        ticket.reservedCount = 0;
      }

      await this.ticketRepository.saveTicket(ticket, manager);

      /******************************************************
       **************** UPDATE RESERVATION ******************
       ******************************************************/

      reservation.status = ReservationStatus.CANCELED;

      await this.reservationRepository.saveReservation(reservation, manager);

      return reservation;
    });
  }

  async expireReservation(reservationId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      /******************************************************
       **************** LOCK RESERVATION *********************
       ******************************************************/

      const reservation = await this.reservationRepository.findByIdForUpdate(
        reservationId,
        manager,
      );

      if (!reservation) {
        return;
      }

      /******************************************************
       ******************* VALIDATION ************************
       ******************************************************/

      if (reservation.status !== ReservationStatus.PENDING) {
        return;
      }

      if (reservation.expiresAt > new Date()) {
        return;
      }

      /******************************************************
       ********************* TICKET **************************
       ******************************************************/

      const ticket = await this.ticketRepository.findByIdForUpdate(
        reservation.ticketId,
        manager,
      );

      if (!ticket) {
        throw new NotFoundError(
          `Ticket with id ${reservation.ticketId} not found.`,
        );
      }

      /******************************************************
       **************** RELEASE CAPACITY *********************
       ******************************************************/

      ticket.reservedCount -= reservation.quantity;

      if (ticket.reservedCount < 0) {
        ticket.reservedCount = 0;
      }

      await this.ticketRepository.saveTicket(ticket, manager);

      /******************************************************
       **************** UPDATE RESERVATION *******************
       ******************************************************/

      reservation.status = ReservationStatus.EXPIRED;

      await this.reservationRepository.saveReservation(reservation, manager);
    });
  }

  async expireReservations(): Promise<void> {
    const reservations =
      await this.reservationRepository.findExpiredReservations();

    for (const reservation of reservations) {
      await this.expireReservation(reservation.id);
    }
  }

  /******************************************************
   ************* @description DELETE HANDLERS *************
   ******************************************************/

  //  This fn only available for admin
  async deleteReservation(id: string) {
    const targetReservation = await this.reservationRepository.findById(id);

    if (!targetReservation) {
      throw new NotFoundError("Reservation with this id does not exist");
    }

    await this.reservationRepository.deleteReservation(id);
  }
}
