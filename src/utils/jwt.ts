import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import ms from "ms";

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

export function signRefreshToken(payload: {
  userId: string;
  role: "user" | "admin";
  email?: string;
}) {
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

export const getRefreshTokenTTLSeconds = (): number => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

  try {
    const milliseconds = ms(expiresIn as ms.StringValue);
    if (milliseconds === undefined) {
      console.warn(
        `⚠️ Invalid REFRESH_TOKEN_EXPIRES_IN: "${expiresIn}", using default 7d`,
      );
      return 7 * 24 * 60 * 60;
    }
    return Math.floor(milliseconds / 1000);
  } catch (error) {
    console.error(
      `❌ Error parsing REFRESH_TOKEN_EXPIRES_IN: "${expiresIn}"`,
      error,
    );
    return 7 * 24 * 60 * 60;
  }
};
