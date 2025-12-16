import { Request, Response, NextFunction } from "express";

export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      return res.status(400).json({ errors: err.issues[0].message });
    }
  };
};
