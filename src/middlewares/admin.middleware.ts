import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: {
    email: string;
  };
}
export function isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  // we can set admin in user entity : Role based access control => in entity role : USER || ADMIN and the logic
  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = req.user?.email;
  if (userEmail !== adminEmail) {
    return res.status(403).json({ message: "FORBIDDEN: Admin only" });
  }
  next();
}
