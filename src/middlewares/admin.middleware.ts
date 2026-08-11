import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/forbidden-error";

export function isAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    throw new ForbiddenError("FORBIDDEN: Admin access required");
  }

  return next();
}
