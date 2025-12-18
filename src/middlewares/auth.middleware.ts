import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AuthPayload } from "../utils/jwt";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    role: "user" | "admin";
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Response | void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token missing or invalid format" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token) as AuthPayload;

    req.user = {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token" });
  }
}
