import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AuthPayload } from "../utils/jwt";
import { NotAuthorizedError } from "../errors/not-authorized-error";
import { userRepository } from "../core";

export async function protect(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
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
    console.log("TOKEN:", token);
    //  check if token is valid, if not throw an NotAuthorizedError
    const payload = verifyAccessToken(token) as AuthPayload;
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      throw new NotAuthorizedError(
        "The user belonging to this token no longer exists!",
      );
    }

    req.user = user;

    next();
  } catch (err) {
    console.log(err);
    throw new NotAuthorizedError("Invalid or expired token");
  }
}
