import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

export const validate =
  <T extends ZodTypeAny>(schema: T) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data as Record<string, any>;

    if (data.body) Object.assign(req.body, data.body);
    if (data.query) Object.assign(req.query, data.query);
    if (data.params) Object.assign(req.params, data.params);

    return next();
  };
