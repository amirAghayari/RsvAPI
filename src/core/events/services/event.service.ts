import { NotFoundError } from "../../../errors/not-found-error";
import { EventRepository } from "../event.repository";
import { Event } from "../event.entity";
import { ICreateEventDto } from "../dtos/create-event.dto";
import { IUpdateEventDto } from "../dtos/update-event.dto";
import { BadRequestError } from "../../../errors/bad-request-error";
import { ForbiddenError } from "../../../errors/forbidden-error";
import { EventStatus } from "../event.status";
import { TicketRepository } from "../../tickets/ticket.repository";
import { logger } from "../../../logger/logger";

export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly ticketRepository: TicketRepository,
  ) {}

  /******************************************************
   ************* @description GET HANDLERS *************
   ******************************************************/

  async getAllEvents(
    query: any,
  ): Promise<{ pagination: any; events: Event[] }> {
    const { pagination, skip, total, events } =
      await this.eventRepository.findAll(query);

    if (query.page && skip >= total) {
      throw new NotFoundError("This page does not exist.");
    }

    return { pagination, events };
  }

  async getEventById(
    eventId: string,
    options?: {
      select?: (keyof Event)[];
      relations?: string[];
    },
  ): Promise<Event | null> {
    const targetEvent = await this.eventRepository.findById(eventId, options);
    if (!targetEvent) {
      throw new NotFoundError(`Event with this id : ${eventId} not found.`);
    }

    return targetEvent;
  }

  /******************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/
  async createEvent(
    userId: string,
    createEventDto: ICreateEventDto,
  ): Promise<Event> {
    if (Object.keys(createEventDto).length === 0) {
      throw new BadRequestError("No fields provided for create.");
    }

    // The authenticated user is the event owner by default.
    // We do not trust the client to send arbitrary userId.
    const now = new Date();
    const startsAt = new Date(createEventDto.startsAt);
    const endsAt = new Date(createEventDto.endsAt);

    if (startsAt < now) {
      throw new BadRequestError(
        "Start time cannot be in the past. Please choose a future time.",
      );
    }

    if (endsAt < startsAt) {
      throw new BadRequestError("End time must be after start time.");
    }

    const newEvent = await this.eventRepository.createEvent({
      ...createEventDto,
      userId: userId,
    });

    logger.info(
      {
        eventId: newEvent.id,
        userId,
      },
      "Event created successfully",
    );

    return newEvent;
  }

  /*******************************************************
   ************* @description PATCH HANDLERS *************
   *******************************************************/
  async updateEvent(
    eventId: string,
    updateEventDto: IUpdateEventDto,
    userId?: string,
    userRole?: string,
  ): Promise<Event> {
    const targetEvent = await this.eventRepository.findById(eventId);

    if (!targetEvent) {
      throw new NotFoundError(`Event with id ${eventId} not found.`);
    }

    // Only the owner or an admin can modify an event.
    if (userRole !== "admin" && targetEvent.userId !== userId) {
      throw new ForbiddenError("You are not allowed to update this event.");
    }

    if (Object.keys(updateEventDto).length === 0) {
      throw new BadRequestError("No fields provided for update.");
    }

    const now = new Date();

    //status valdation

    if (updateEventDto.status) {
      const currentStatus = targetEvent.status;
      const newStatus = updateEventDto.status;

      if (currentStatus === newStatus) {
        throw new BadRequestError(
          `Event is already in ${currentStatus} status.`,
        );
      }

      switch (currentStatus) {
        case EventStatus.DRAFT:
          // The organizer can draft or cancel the event, but publishing must be reviewed by admin.
          if (
            ![EventStatus.PUBLISHED, EventStatus.CANCELED].includes(newStatus)
          ) {
            throw new BadRequestError(
              "From DRAFT you can only change to PUBLISHED or CANCELED.",
            );
          }
          break;

        case EventStatus.PUBLISHED:
          // In-progress and finished should be system-managed based on time, not manually updated.
          if (![EventStatus.CANCELED].includes(newStatus)) {
            throw new BadRequestError(
              "From PUBLISHED you can only change to CANCELED.",
            );
          }
          break;

        case EventStatus.IN_PROGRESS:
          if (
            ![EventStatus.FINISHED, EventStatus.CANCELED].includes(newStatus)
          ) {
            throw new BadRequestError(
              "From IN_PROGRESS you can only change to FINISHED or CANCELED.",
            );
          }
          break;

        case EventStatus.CANCELED:
        case EventStatus.FINISHED:
          throw new BadRequestError(
            `Cannot change status from ${currentStatus}.`,
          );
      }

      //publish validations
      if (newStatus === EventStatus.PUBLISHED) {
        // Only an admin may approve an event for public sale.
        if (userRole !== "admin") {
          throw new ForbiddenError("Only an admin can publish an event.");
        }

        if (targetEvent.startsAt <= now) {
          throw new BadRequestError(
            "Cannot publish an event that has already started.",
          );
        }

        const tickets = await this.ticketRepository.findByEventId(eventId);

        if (!tickets.length) {
          throw new BadRequestError(
            "Event must have at least one ticket before publishing.",
          );
        }

        const invalidTicket = tickets.find(
          (ticket) =>
            ticket.capacity <= 0 || ticket.saleStartsAt >= ticket.saleEndsAt,
        );

        if (invalidTicket) {
          throw new BadRequestError(
            "All tickets must have valid capacity and sale period before publishing.",
          );
        }
      }
    }

    // date validation
    if (
      targetEvent.status !== EventStatus.DRAFT &&
      (updateEventDto.startsAt || updateEventDto.endsAt)
    ) {
      throw new BadRequestError(
        "Cannot change event schedule after publishing.",
      );
    }

    const startsAt = updateEventDto.startsAt
      ? new Date(updateEventDto.startsAt)
      : targetEvent.startsAt;

    const endsAt = updateEventDto.endsAt
      ? new Date(updateEventDto.endsAt)
      : targetEvent.endsAt;

    if (startsAt <= now) {
      throw new BadRequestError("Event start time must be in the future.");
    }

    if (endsAt <= startsAt) {
      throw new BadRequestError("Event end time must be after start time.");
    }

    // update event

    const updatedEvent = await this.eventRepository.updateEvent(
      eventId,
      updateEventDto,
    );

    if (!updatedEvent) {
      throw new NotFoundError(
        `Event with id ${eventId} not found after update.`,
      );
    }

    if (updatedEvent.status === EventStatus.PUBLISHED) {
      logger.info(
        {
          eventId,
          approvedBy: userId,
        },
        "Event published successfully",
      );
    } else {
      logger.info(
        {
          eventId,
          userId,
          status: updatedEvent.status,
        },
        "Event updated successfully",
      );
    }

    return updatedEvent;
  }

  /*******************************************************
   ************* @description DELETE HANDLERS *************
   *******************************************************/

  async deleteEvent(
    eventId: string,
    userId?: string,
    userRole?: string,
  ): Promise<void> {
    const targetEvent = await this.eventRepository.findById(eventId);

    if (!targetEvent) {
      throw new NotFoundError("Event with this id does not exist");
    }

    // Only the organizer or an admin can remove an event.
    if (userRole !== "admin" && targetEvent.userId !== userId) {
      throw new ForbiddenError("You are not allowed to delete this event.");
    }

    if (
      targetEvent.status === EventStatus.PUBLISHED ||
      targetEvent.status === EventStatus.FINISHED ||
      targetEvent.status === EventStatus.IN_PROGRESS
    ) {
      throw new BadRequestError("Cannot delete a published or finished event.");
    }

    await this.eventRepository.deleteEvent(eventId);

    logger.info(
      {
        eventId,
        userId,
      },
      "Event deleted successfully",
    );
  }
}
