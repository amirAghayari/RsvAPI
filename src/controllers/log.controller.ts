import { Request, Response } from "express";
import LogService from "../services/log.service";

export class LogController {
  async getLogs(req: Request, res: Response) {
    try {
      const filters = {
        userEmail: req.query.userEmail as string | undefined,
        eventId: req.query.eventId as string | undefined,
        status: req.query.status as string | undefined,
        fromDate: req.query.fromDate as string | undefined,
        toDate: req.query.toDate as string | undefined,
        minSoldTickets: req.query.minSoldTickets
          ? Number(req.query.minSoldTickets)
          : undefined,
      };

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const logs = await LogService.getLogs({ ...filters, page, limit });
      return res.json(logs);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new LogController();
