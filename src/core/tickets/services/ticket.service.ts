import { BadRequestError } from "../../../errors/bad-request-error";
import { ForbiddenError } from "../../../errors/forbidden-error";
import { NotFoundError } from "../../../errors/not-found-error";
import { EventRepository } from "../../events/event.repository";
import { Ticket } from "../ticket.entity";
import { TicketRepository } from "../ticket.repository";
import { ICreateTicketDto } from "../dtos/create-ticket.dto";
import { IUpdateTicketDto } from "../dtos/update-ticket.dto";
import { EventStatus } from "../../../utils/event.status";

export class TicketService {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  /******************************************************
   ************* @description GET HANDLERS **************
   ******************************************************/

  async getAllTickets(
    query: any,
  ): Promise<{ pagination: any; tickets: Ticket[] }> {
    const { pagination, skip, total, tickets } =
      await this.ticketRepository.findAll(query);

    if (query.page && skip >= total) {
      throw new NotFoundError("This page does not exist.");
    }

    return {
      pagination,
      tickets,
    };
  }

  async getTicketById(
    ticketId: string,
    options?: {
      select?: (keyof Ticket)[];
      relations?: string[];
    },
  ): Promise<Ticket | null> {
    const ticket = await this.ticketRepository.findById(ticketId, options);

    if (!ticket) {
      throw new NotFoundError(`Ticket with id : ${ticketId} not found.`);
    }
    const event = await this.eventRepository.findById(ticket.eventId);

    if (event?.status !== EventStatus.PUBLISHED) {
      throw new BadRequestError("This event does not published yet.");
    }

    return ticket;
  }

  async getTicketsByEventId(eventId: string): Promise<Ticket[]> {
    const targetEvent = await this.eventRepository.findById(eventId);

    if (!targetEvent) {
      throw new NotFoundError(`Event with this id:${eventId} not found. `);
    }

    return await this.ticketRepository.findByEventId(eventId);
  }

  /******************************************************
   ************* @description POST HANDLERS **************
   ******************************************************/

  async createTicket(
    userId: string,
    createTicketDto: ICreateTicketDto,
    userRole?: string,
  ): Promise<Ticket> {
    const targetEvent = await this.eventRepository.findById(
      createTicketDto.eventId,
    );

    if (!targetEvent) {
      throw new NotFoundError(
        `Event with this id:${createTicketDto.eventId} not found. `,
      );
    }

    // Only the event owner or admin can create tickets for that event.
    if (userRole !== "admin" || targetEvent.userId !== userId) {
      throw new ForbiddenError(
        "You are not allowed to create tickets for this event.",
      );
    }

    if (createTicketDto.price < 0) {
      throw new BadRequestError("Price cannot be negative.");
    }

    if (createTicketDto.capacity <= 0) {
      throw new BadRequestError("Capacity must be greater than zero.");
    }

    if (
      createTicketDto.maxPerUser &&
      createTicketDto.maxPerUser > createTicketDto.capacity
    ) {
      throw new BadRequestError("Max per user cannot exceed capacity.");
    }

    const start = new Date(createTicketDto.saleStartsAt);
    const end = new Date(createTicketDto.saleEndsAt);
    const now = new Date();

    if (start <= now) {
      throw new BadRequestError("Sale start time cannot be in the past.");
    }

    if (end <= start) {
      throw new BadRequestError("Sale end time must be after sale start time.");
    }

    return await this.ticketRepository.createTicket(createTicketDto);
  }

  /******************************************************
   ************* @description PATCH HANDLERS *************
   ******************************************************/

  async updateTicket(
    ticketId: string,
    updateTicketDto: IUpdateTicketDto,
    userId?: string,
    userRole?: string,
  ): Promise<Ticket | null> {
    const targetTicket = await this.ticketRepository.findById(ticketId);

    if (!targetTicket) {
      throw new NotFoundError(`Ticket with this id:${ticketId} not found. `);
    }

    const targetEvent = await this.eventRepository.findById(
      targetTicket.eventId,
    );

    if (!targetEvent) {
      throw new NotFoundError(
        `Event with this id:${targetTicket.eventId} not found. `,
      );
    }

    // Protect ticket mutation from unauthorized users.
    if (userRole !== "admin" && targetEvent.userId !== userId) {
      throw new ForbiddenError("You are not allowed to update this ticket.");
    }

    if (updateTicketDto.price !== undefined && updateTicketDto.price < 0) {
      throw new BadRequestError("Price cannot be negative.");
    }

    if (
      updateTicketDto.capacity !== undefined &&
      updateTicketDto.capacity < targetTicket.reservedCount
    ) {
      throw new BadRequestError("Capacity cannot be less than reserved count.");
    }

    if (
      updateTicketDto.maxPerUser &&
      updateTicketDto.capacity &&
      updateTicketDto.maxPerUser > updateTicketDto.capacity
    ) {
      throw new BadRequestError("Max per user cannot exceed capacity.");
    }

    const start = updateTicketDto.saleStartsAt
      ? new Date(updateTicketDto.saleStartsAt)
      : targetTicket.saleStartsAt;

    const end = updateTicketDto.saleEndsAt
      ? new Date(updateTicketDto.saleEndsAt)
      : targetTicket.saleEndsAt;

    if (end <= start) {
      throw new BadRequestError("Sale end time must be after sale start time.");
    }

    return await this.ticketRepository.updateTicket(ticketId, updateTicketDto);
  }

  /******************************************************
   ************* @description DELETE HANDLERS ************
   ******************************************************/

  async deleteTicket(
    ticketId: string,
    userId?: string,
    userRole?: string,
  ): Promise<void> {
    const targetTicket = await this.ticketRepository.findById(ticketId, {
      relations: ["reservations"],
    });

    if (!targetTicket) {
      throw new NotFoundError(`Ticket with this id:${ticketId} not found. `);
    }

    const targetEvent = await this.eventRepository.findById(
      targetTicket.eventId,
    );

    if (!targetEvent) {
      throw new NotFoundError(
        `Event with this id:${targetTicket.eventId} not found. `,
      );
    }

    // You cannot delete a ticket that another organizer owns.
    if (userRole !== "admin" && targetEvent.userId !== userId) {
      throw new ForbiddenError("You are not allowed to delete this ticket.");
    }

    if (targetTicket.reservations.length > 0) {
      throw new BadRequestError("Cannot delete a ticket with reservations.");
    }

    await this.ticketRepository.deleteTicket(ticketId);
  }
}
