import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    // attach user id to request
    (req as any).user = { id: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
