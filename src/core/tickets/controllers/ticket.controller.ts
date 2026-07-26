import { Request, Response } from "express";
import { TicketService } from "../services/ticket.service";
import { ICreateTicketDto } from "../dtos/create-ticket.dto";
import { IUpdateTicketDto } from "../dtos/update-ticket.dto";

export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  /******************************************************
   ************* @description GET HANDLERS **************
   ******************************************************/
  async findAllTickets(req: Request, res: Response) {
    const { pagination, tickets } = await this.ticketService.getAllTickets(
      req.query,
    );

    res.status(200).json({
      status: "success",
      results: tickets.length,
      pagination,
      data: {
        tickets,
      },
    });
  }

  async findTicketById(req: Request, res: Response) {
    const ticket = await this.ticketService.getTicketById(req.params.id);

    res.status(200).json({
      status: "success",
      data: {
        ticket,
      },
    });
  }

  async findTicketsByEventId(req: Request, res: Response) {
    const tickets = await this.ticketService.getTicketsByEventId(
      req.params.eventId,
    );

    res.status(200).json({
      status: "success",
      results: tickets.length,
      data: {
        tickets,
      },
    });
  }

  /******************************************************
   ************* @description POST HANDLERS **************
   ******************************************************/

  async createTicket(req: Request, res: Response) {
    const ticket = await this.ticketService.createTicket(
      req.user.id,
      req.body as ICreateTicketDto,
      req.user.role,
    );

    res.status(201).json({
      status: "success",
      data: {
        ticket,
      },
    });
  }

  /******************************************************
   ************* @description PATCH HANDLERS *************
   ******************************************************/

  async updateTicket(req: Request, res: Response) {
    const updatedTicket = await this.ticketService.updateTicket(
      req.params.id,
      req.body as IUpdateTicketDto,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({
      status: "success",
      data: {
        updatedTicket,
      },
    });
  }

  /******************************************************
   ************* @description DELETE HANDLERS ************
   ******************************************************/

  async deleteTicket(req: Request, res: Response) {
    await this.ticketService.deleteTicket(
      req.params.id,
      req.user.id,
      req.user.role,
    );

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
}
