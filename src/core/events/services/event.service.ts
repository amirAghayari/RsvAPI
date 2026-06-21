import { NotFoundError } from "../../../errors/not-found-error";
import { EventRepository } from "../event.repository";
import { Event } from "../event.entity";
import { ICreateEventDto } from "../dtos/create-event.dto";
import { IUpdateEventDto } from "../dtos/update-event.dto";
import { BadRequestError } from "../../../errors/bad-request-error";

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
    if (salesStartTime <= now) {
      throw new BadRequestError(
        "Start time cannot be in the past. Please choose a future time.",
      );
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
    const salesStartTime = new Date(updateEventDto.salesStartTime!);

    if (salesStartTime <= now) {
      throw new BadRequestError(
        "Start time cannot be in the past. Please choose a future time.",
      );
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

    await this.eventRepository.deleteEvent(eventId);
  }
}
