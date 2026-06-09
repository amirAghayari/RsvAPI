import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AuthPayload } from "../utils/jwt";
import { NotAuthorizedError } from "../errors/not-authorized-error";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: "user" | "admin";
  };
}

export function protect(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Response | void {
  // Get token from header or cookie
  const { authorization } = req.headers;
  let token: string | undefined = undefined;
  if (authorization && authorization.startsWith("Bearer")) {
    token = authorization.split(" ")[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  // if no token, throw an error
  if (!token) {
    throw new NotAuthorizedError(
      "You are not logged in! Please log in to access.",
    );
  }

  try {
    //  check if token is valid, if not throw an NotAuthorizedError
    const payload = verifyAccessToken(token) as AuthPayload;

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (err) {
    throw new NotAuthorizedError("Invalid or expired token");
  }
}
