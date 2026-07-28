import { DataSource, EntityManager } from "typeorm";
import { NotFoundError } from "../../../errors/not-found-error";
import { UserRepository } from "../../users/user.repository";

import { Reservation } from "../reservation.entity";
import { ReservationRepository } from "../reservation.repository";
import { DuplicateError } from "../../../errors/duplicate-error";
import { BadRequestError } from "../../../errors/bad-request-error";
import { EventStatus } from "../../events/event.status";
import { ReservationStatus } from "../reservation.status";
import { TicketRepository } from "../../tickets/ticket.repository";
import { EventRepository } from "../../events/event.repository";
import { logger } from "../../../logger/logger";

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

    //ownership
    if (reservation.userId !== userId) {
      throw new BadRequestError(
        "You are not allowed to pay for this reservation.",
      );
    }

    // check status
    switch (reservation.status) {
      case ReservationStatus.CONFIRMED:
        throw new BadRequestError("Reservation has already been paid.");

      case ReservationStatus.CANCELED:
        throw new BadRequestError("Reservation has been canceled.");

      case ReservationStatus.EXPIRED:
        throw new BadRequestError("Reservation has expired.");
    }

    //validate expires time
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
      // Validate user existence
      const user = await this.userRepository.findById(
        userId,
        undefined,
        manager,
      );

      if (!user) {
        throw new NotFoundError(`User with id ${userId} not found.`);
      }

      // Lock ticket for update
      const ticket = await this.ticketRepository.findByIdForUpdate(
        ticketId,
        manager,
      );

      if (!ticket) {
        throw new NotFoundError(`Ticket with id ${ticketId} not found.`);
      }

      // Validate event availability
      const event = await this.eventRepository.findByIdForUpdate(
        ticket.eventId,
        manager,
      );

      if (!event) {
        throw new NotFoundError("Event not found.");
      }

      // Progress/finish should be driven by event time, not by reservation count.
      const now = new Date();

      if (event.status === EventStatus.PUBLISHED && event.startsAt <= now) {
        event.status = EventStatus.IN_PROGRESS;
        await this.eventRepository.saveEvent(event, manager);
        logger.info(
          {
            eventId: event.id,
            status: event.status,
          },
          "Event status updated automatically",
        );
      }

      if (event.status === EventStatus.IN_PROGRESS && event.endsAt <= now) {
        event.status = EventStatus.FINISHED;
        await this.eventRepository.saveEvent(event, manager);
        logger.info(
          {
            eventId: event.id,
            status: event.status,
          },
          "Event status updated automatically",
        );
      }

      if (
        event.status === EventStatus.CANCELED ||
        event.status === EventStatus.FINISHED
      ) {
        throw new BadRequestError("Event is not available.");
      }

      if (event.status !== EventStatus.PUBLISHED) {
        throw new BadRequestError(
          "This event is not available for reservation.",
        );
      }

      // Validate reservation request
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

      // Prevent duplicate pending reservation
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

      // Reserve ticket capacity
      ticket.reservedCount += quantity;

      await this.ticketRepository.saveTicket(ticket, manager);

      // Create pending reservation
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

      logger.info(
        {
          reservationId: reservation.id,
          userId,
          ticketId,
          quantity,
          expiresAt,
        },
        "Reservation created successfully",
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
      // Lock reservation for update
      const reservation = await this.reservationRepository.findByIdForUpdate(
        reservationId,
        manager,
      );

      if (!reservation) {
        throw new NotFoundError(
          `Reservation with id ${reservationId} not found.`,
        );
      }

      // check ownerShip
      if (reservation.userId !== userId) {
        throw new BadRequestError(
          "You are not allowed to cancel this reservation.",
        );
      }
      // Validate reservation request
      switch (reservation.status) {
        case ReservationStatus.CANCELED:
          throw new BadRequestError("Reservation already canceled.");

        case ReservationStatus.EXPIRED:
          throw new BadRequestError("Reservation already expired.");

        case ReservationStatus.CONFIRMED:
          throw new BadRequestError("Paid reservations cannot be canceled.");
      }

      // Lock ticket for update
      const ticket = await this.ticketRepository.findByIdForUpdate(
        reservation.ticketId,
        manager,
      );

      if (!ticket) {
        throw new NotFoundError(
          `Ticket with id ${reservation.ticketId} not found.`,
        );
      }

      //release ticket capacity
      ticket.reservedCount -= reservation.quantity;

      if (ticket.reservedCount < 0) {
        ticket.reservedCount = 0;
      }

      await this.ticketRepository.saveTicket(ticket, manager);

      //update reservation
      reservation.status = ReservationStatus.CANCELED;

      await this.reservationRepository.saveReservation(reservation, manager);

      logger.info(
        {
          reservationId,
          userId,
          ticketId: reservation.ticketId,
        },
        "Reservation canceled successfully",
      );

      return reservation;
    });
  }

  async expireReservation(reservationId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Lock reservation for update
      const reservation = await this.reservationRepository.findByIdForUpdate(
        reservationId,
        manager,
      );

      if (!reservation) {
        return;
      }

      //validate reservation
      if (reservation.status !== ReservationStatus.PENDING) {
        return;
      }

      if (reservation.expiresAt > new Date()) {
        return;
      }

      // Lock ticket for update
      const ticket = await this.ticketRepository.findByIdForUpdate(
        reservation.ticketId,
        manager,
      );

      if (!ticket) {
        throw new NotFoundError(
          `Ticket with id ${reservation.ticketId} not found.`,
        );
      }

      //release ticket capacity
      ticket.reservedCount -= reservation.quantity;

      if (ticket.reservedCount < 0) {
        ticket.reservedCount = 0;
      }

      await this.ticketRepository.saveTicket(ticket, manager);

      //update reservation
      reservation.status = ReservationStatus.EXPIRED;

      await this.reservationRepository.saveReservation(reservation, manager);
      logger.info(
        {
          reservationId: reservation.id,
          ticketId: reservation.ticketId,
          userId: reservation.userId,
        },
        "Reservation expired",
      );
    });
  }

  async expireReservations(): Promise<void> {
    const reservations =
      await this.reservationRepository.findExpiredReservations();

    for (const reservation of reservations) {
      await this.expireReservation(reservation.id);
    }
    if (reservations.length > 0) {
      logger.info(
        {
          expiredCount: reservations.length,
        },
        "Expired reservations processed",
      );
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
    logger.info(
      {
        reservationId: id,
      },
      "Reservation deleted successfully",
    );
  }
}
