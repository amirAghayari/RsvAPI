import jwt from "jsonwebtoken";

const ACCESS_SECRET = (process.env.JWT_ACCESS_SECRET ||
  "access-secret") as jwt.Secret;
const REFRESH_SECRET = (process.env.JWT_REFRESH_SECRET ||
  "refresh-secret") as jwt.Secret;
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export function signAccessToken(payload: object) {
  const opts: jwt.SignOptions = {
    expiresIn: ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload as any, ACCESS_SECRET, opts);
}

export function signRefreshToken(payload: object) {
  const opts: jwt.SignOptions = {
    expiresIn: REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload as any, REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as any;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as any;
}
