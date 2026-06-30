import { DataSource } from "typeorm";
import { NotFoundError } from "../../../errors/not-found-error";
import { EventRepository } from "../../events/event.repository";
import { UserRepository } from "../../users/user.repository";
import { ICreateReservationDto } from "../dtos/create-reservation.dto";
import { Reservation } from "../reservation.entity";
import { ReservationRepository } from "../reservation.repository";
import { DuplicateError } from "../../../errors/duplicate-error";
import { BadRequestError } from "../../../errors/bad-request-error";
import { EventStatus } from "../../../utils/event.status";
import { ReservationStatus } from "../../../utils/reservation.status";

export class ReservationService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly userRepository: UserRepository,
    private readonly eventRepository: EventRepository,
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

  async getExpiredReservations(): Promise<Reservation[]> {
    return await this.reservationRepository.findExpiredReservations();
  }

  async getConfirmedReservations(): Promise<Reservation[]> {
    return await this.reservationRepository.findConfirmedReservations();
  }

  async getPendingReservations(): Promise<Reservation[]> {
    return await this.reservationRepository.findPendingReservations();
  }

  async getReservationById(
    id: string,
    option: {
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
    option: {
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
    option: {
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
    createReservationDto: ICreateReservationDto,
  ): Promise<Reservation> {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.userRepository.findById(
        createReservationDto.userId,
        undefined,
        manager,
      );

      if (!user) {
        throw new NotFoundError(
          `User with id ${createReservationDto.userId} not found.`,
        );
      }

      const event = await this.eventRepository.findById(
        createReservationDto.eventId,
        undefined,
        manager,
      );

      if (!event) {
        throw new NotFoundError(
          `Event with id ${createReservationDto.eventId} not found.`,
        );
      }

      const exists = await this.reservationRepository.existsReservation(
        createReservationDto.userId,
        createReservationDto.eventId,
        manager,
      );

      if (exists) {
        throw new DuplicateError("You have already reserved this event.");
      }

      if (event.remainingCapacity <= 0) {
        throw new BadRequestError("Event capacity is full.");
      }

      if (event.remainingCapacity === 0) {
        event.status = EventStatus.SOLD_OUT;
      }

      if ((event.status = EventStatus.CANCELED)) {
        throw new BadRequestError("Event canceled.");
      }

      if ((event.status = EventStatus.FINISHED)) {
        throw new BadRequestError("Event finished.");
      }
      if ((event.status = EventStatus.DRAFT)) {
        throw new BadRequestError("Event not published yet.");
      }

      event.remainingCapacity--;
      await this.eventRepository.saveEvent(event, manager);

      const newReservation = await this.reservationRepository.createReservation(
        createReservationDto,
        manager,
      );

      event.reservations.push(newReservation);
      user.reservations.push(newReservation);

      return await this.reservationRepository.saveReservation(newReservation);
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
}
