import { DataSource } from "typeorm";
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
  ): Promise<Reservation | null> {
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

  async getReservationByEventId(
    eventId: string,
    option: {
      select?: (keyof Reservation)[];
      relations?: string[];
    },
  ): Promise<Reservation | null> {
    const event = await this.eventRepository.findById(eventId);

    const targetReservation = await this.reservationRepository.findByEventId(
      eventId,
      option,
    );

    if (!event) {
      throw new NotFoundError(`User with this id : ${eventId} not found.`);
    }

    if (!targetReservation) {
      throw new NotFoundError(
        `No reservations were found for this event with this ID : ${eventId}.`,
      );
    }

    return targetReservation;
  }

  async getReservationByUserAndEventId(
    userId: string,
    eventId: string,
    option?: {
      select?: (keyof Reservation)[];
      relations?: string[];
    },
  ): Promise<Reservation | null> {
    const event = await this.eventRepository.findById(eventId);
    const user = await this.userRepository.findById(userId);

    const targetReservation =
      await this.reservationRepository.findByUserAndEventId(
        userId,
        eventId,
        option,
      );

    if (!event) {
      throw new NotFoundError(`Event with this id : ${eventId} not found.`);
    }
    if (!user) {
      throw new NotFoundError(`User with this id : ${userId} not found.`);
    }

    if (!targetReservation) {
      throw new NotFoundError(
        `No reservations were found for this event with this ID : ${eventId} and user with this ID : ${userId}.`,
      );
    }

    return targetReservation;
  }

  async reservationCountByEvent(eventId: string): Promise<number> {
    const count = await this.reservationRepository.countByEvent(eventId);

    if (count == 0) {
      throw new NotFoundError(`Reservation not found for event ${eventId}`);
    }

    return count;
  }

  async reservationIsExists(userId: string, eventId: string): Promise<boolean> {
    const event = await this.eventRepository.findById(eventId);
    const user = await this.userRepository.findById(userId);

    const exists: boolean = await this.reservationRepository.existsReservation(
      userId,
      eventId,
    );

    if (!event) {
      throw new NotFoundError(`Event with this id : ${eventId} not found.`);
    }
    if (!user) {
      throw new NotFoundError(`User with this id : ${userId} not found.`);
    }

    return exists;
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

  async updateReservationStatus(
    id: string,
    status: ReservationStatus,
  ): Promise<Reservation | null> {
    const targetReservation = await this.reservationRepository.findById(id);

    if (!targetReservation) {
      throw new NotFoundError(`Reservation with id : ${id} not found.`);
    }

    if (
      targetReservation.status === ReservationStatus.EXPIRED ||
      targetReservation.status === ReservationStatus.CANCELED
    ) {
      throw new BadRequestError(
        "Cannot update the expired or canceled reservation.",
      );
    }
    if (targetReservation.status === ReservationStatus.PAID) {
      throw new BadRequestError("Cannot update the paid reservation.");
    }

    await this.reservationRepository.updateReservationStatus(id, status);
    const updatedReservation = await this.reservationRepository.findById(id, {
      select: ["status"],
    });

    return updatedReservation;
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
