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

    const data = parsed.data as {
      body?: Request["body"];
      params?: Request["params"];
    };

    /**
     * Replace validated body
     */
    if (data.body) {
      req.body = data.body;
    }

    /**
     * Replace validated params
     */
    if (data.params) {
      req.params = data.params;
    }

    return next();
  };
