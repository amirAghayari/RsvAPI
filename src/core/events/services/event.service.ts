import { NotFoundError } from "../../../errors/not-found-error";
import { EventRepository } from "../event.repository";
import { Event } from "../event.entity";
import { ICreateEventDto } from "../dtos/create-event.dto";
import { IUpdateEventDto } from "../dtos/update-event.dto";
import { BadRequestError } from "../../../errors/bad-request-error";
import { EventStatus } from "../../../utils/event.status";

export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

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

  async findEventById(
    eventId: string,
    options?: {
      select?: (keyof Event)[];
      relations?: string[];
    },
  ): Promise<Event | null> {
    const targetEvent = await this.eventRepository.findById(eventId, options);
    if (!targetEvent) {
      throw new NotFoundError(`event with this id : ${eventId} not found.`);
    }

    return targetEvent;
  }

  /******************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/

  async createEvent(createEventDto: ICreateEventDto): Promise<Event> {
    const now = new Date();
    const salesStartTime = new Date(createEventDto.salesStartTime);
    const salesEndTime = new Date(createEventDto.salesEndTime);

    if (salesStartTime <= now) {
      throw new BadRequestError(
        "Start time cannot be in the past. Please choose a future time.",
      );
    }

    if (salesEndTime <= now) {
      throw new BadRequestError(
        "End time cannot be in the past. Please choose a future time.",
      );
    }

    if (salesEndTime <= salesStartTime) {
      throw new BadRequestError("End time must be after start time.");
    }
    const newEvent = await this.eventRepository.createEvent(createEventDto);

    return newEvent;
  }

  /*******************************************************
   ************* @description PATCH HANDLERS *************
   *******************************************************/

  async updateEvent(
    eventId: string,
    updateEventDto: IUpdateEventDto,
  ): Promise<Event | null> {
    const targetEvent = await this.eventRepository.findById(eventId);
    if (!targetEvent) {
      throw new NotFoundError("Event with this id not found.");
    }

    const now = new Date();

    if (updateEventDto.status) {
      const currentStatus = targetEvent.status;
      const newStatus = updateEventDto.status;

      if (
        currentStatus === EventStatus.DRAFT &&
        newStatus !== EventStatus.PUBLISHED
      ) {
        throw new BadRequestError(`From DRAFT you can only go to PUBLISHED.`);
      }

      if (
        currentStatus === EventStatus.PUBLISHED &&
        newStatus === EventStatus.DRAFT
      ) {
        throw new BadRequestError(
          `From PUBLISHED you can only go to CANCELED or FINISHED.`,
        );
      }
      // if (newStatus === EventStatus.FINISHED) {
      //   const endTime = new Date(targetEvent.salesEndTime);
      //   if (endTime > now) {
      //     throw new BadRequestError(`Cannot finish before sales end time.`);
      //   }
      // }

      if (
        currentStatus === EventStatus.CANCELED ||
        currentStatus === EventStatus.FINISHED
      ) {
        throw new BadRequestError(
          `Cannot change from final state: ${currentStatus}`,
        );
      }
    }

    if (updateEventDto.salesStartTime) {
      const salesStartTime = new Date(updateEventDto.salesStartTime);
      if (salesStartTime <= now) {
        throw new BadRequestError(
          "Start time cannot be in the past. Please choose a future time.",
        );
      }
    }
    if (updateEventDto.salesEndTime) {
      const salesEndTime = new Date(updateEventDto.salesEndTime);
      if (salesEndTime <= now) {
        throw new BadRequestError(
          "End time cannot be in the past. Please choose a future time.",
        );
      }
    }

    if (updateEventDto.salesStartTime && updateEventDto.salesEndTime) {
      const start = new Date(updateEventDto.salesStartTime);
      const end = new Date(updateEventDto.salesEndTime);
      if (end <= start) {
        throw new BadRequestError("End time must be after start time.");
      }
    }
    const updateEvent = await this.eventRepository.updateEvent(
      eventId,
      updateEventDto,
    );

    return updateEvent;
  }

  /*******************************************************
   ************* @description DELETE HANDLERS *************
   *******************************************************/

  async deleteEvent(eventId: string): Promise<void> {
    const targetEvent = await this.eventRepository.findById(eventId);

    if (!targetEvent) {
      throw new NotFoundError("Event with this id does not exist");
    }
    if (
      targetEvent.status === EventStatus.PUBLISHED ||
      targetEvent.status === EventStatus.FINISHED
    ) {
      throw new BadRequestError("Cannot delete a published or finished event.");
    }

    await this.eventRepository.deleteEvent(eventId);
  }
}
