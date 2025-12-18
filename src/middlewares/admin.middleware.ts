import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: {
    email: string;
    role: "user" | "admin";
  };
}
export function isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ message: "FORBIDDEN: Admin access required" });
  }

  next();
}
