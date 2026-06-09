import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/forbidden-error";

interface AuthRequest extends Request {
  user?: {
    email: string;
    role: "user" | "admin";
  };
}
export function isAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    throw new ForbiddenError("FORBIDDEN: Admin access required");
  }

  return next();
}
