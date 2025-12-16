import { Request, Response } from "express";
import { EventService } from "../services/Event.service";

export class EventController {
  constructor(private eventService: EventService) {}

  findAll = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const events = await this.eventService.findAllEvents();
      return res.status(200).json(events);
    } catch (error: any) {
      console.error("Error fetching events:", error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  // TODO:
  // 💡 متد ادمین: برای تزریق داده اولیه
  create = async (req: Request, res: Response): Promise<Response> => {
    // 💡 در یک سناریوی واقعی، این روت باید با میدل‌ور ادمین محافظت شود.
    try {
      const data = req.body;
      // فرض می‌کنیم اعتبارسنجی ورودی انجام شده است
      const newEvent = await this.eventService.createEvent(data);
      return res.status(201).json(newEvent);
    } catch (error: any) {
      console.error("Error creating event:", error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}
