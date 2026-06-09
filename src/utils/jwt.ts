import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export interface AuthPayload extends JwtPayload {
  userId: string;
  role: "user" | "admin";
}

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("FATAL: JWT_ACCESS_SECRET is not defined.");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("FATAL: JWT_REFRESH_SECRET is not defined.");
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as jwt.Secret;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as jwt.Secret;

const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export function signAccessToken(payload: {
  userId: string;
  role: "user" | "admin";
  email?: string;
}) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: { userId: string }) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, ACCESS_SECRET) as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, REFRESH_SECRET) as AuthPayload;
}
