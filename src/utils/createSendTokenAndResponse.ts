import { Response } from "express";
import { User } from "../core/users/user.entity";
import {
  signAccessToken,
  signRefreshToken,
  getRefreshTokenTTLSeconds,
} from "./jwt";
import _ from "lodash";
import ms, { StringValue } from "ms";

import { refreshTokenService } from "../core";

const createSendTokenAndResponse = async (
  user: User,
  statusCode: number,
  res: Response,
) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets not defined");
  }

  const payload = {
    userId: user.id,
    role: user.role,
    email: user.email,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie("jwt", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ms(process.env.JWT_COOKIE_EXPIRES_IN as StringValue),
  });

  // Set refresh token cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ms(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN as StringValue),
  });

  const ttlSeconds = getRefreshTokenTTLSeconds();
  await refreshTokenService.storeRefreshTokenInRedis(
    user.id,
    refreshToken,
    ttlSeconds,
  );

  await refreshTokenService.storeRefreshTokenInRedisInDB(user, refreshToken);
  // const userRepository = AppDataSource.getRepository(User);
  // user.refreshToken = refreshToken;
  // await userRepository.save(user);

  return res
    .status(statusCode)
    .header("x-auth-token", accessToken)
    .json({
      status: "success",
      data: {
        user: _.pick(user, ["id", "name", "email", "role", "photo"]),
      },
    });
};

export default createSendTokenAndResponse;
