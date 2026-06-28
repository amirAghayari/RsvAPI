import { Request, Response } from "express";
import { EventService } from "../services/event.service";
import { ICreateEventDto } from "../dtos/create-event.dto";
import { IUpdateEventDto } from "../dtos/update-event.dto";

export class EventController {
  constructor(private readonly eventService: EventService) {}

  /******************************************************
   ************* @description GET HANDLERS *************
   ******************************************************/

  async findAllEvents(req: Request, res: Response) {
    const { pagination, events } = await this.eventService.getAllEvents(
      req.query,
    );

    res.status(200).json({
      status: "success",
      results: events.length,
      pagination,
      data: events,
    });
  }

  async findEventById(req: Request, res: Response) {
    const event = await this.eventService.getEventById(req.params.id);
    res.status(200).json({
      status: "success",
      data: event,
    });
  }

  /******************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/
  async createEvent(req: Request, res: Response) {
    const event = await this.eventService.createEvent(
      req.body as ICreateEventDto,
    );
    res.status(201).json({
      status: "success",
      data: { event },
    });
  }

  /******************************************************
   ************* @description PATCH HANDLERS *************
   ******************************************************/
  async updateEvent(req: Request, res: Response) {
    const updatedEvent = await this.eventService.updateEvent(
      req.params.id,
      req.body as IUpdateEventDto,
    );

    res.status(200).json({
      status: "success",
      data: { updatedEvent },
    });
  }

  /********************************************************
   ************* @description DELETE HANDLERS *************
   *********************************************************/

  async deleteEvent(req: Request, res: Response) {
    await this.eventService.deleteEvent(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
}
