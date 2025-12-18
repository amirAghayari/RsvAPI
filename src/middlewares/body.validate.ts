import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // تبدیل ticketCount به number
      if (req.body.ticketCount) {
        req.body.ticketCount = Number(req.body.ticketCount);
      }

      // parse JSON string برای details
      if (req.body.details && typeof req.body.details === "string") {
        req.body.details = JSON.parse(req.body.details);
      }

      schema.parse(req.body);
      next();
    } catch (err: any) {
      // اطمینان از اینکه ZodError هست
      if (err instanceof ZodError) {
        return res
          .status(400)
          .json({ errors: err.issues.map((e) => e.message) });
      }

      // خطاهای parse یا دیگر
      return res
        .status(400)
        .json({ errors: err.message || "Invalid request body" });
    }
  };
};
