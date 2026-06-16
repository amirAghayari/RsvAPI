import { getRedisClient } from "../../../config/redisClient";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../user.entity";
import AppDataSource from "../../../config/dataSource";

const PREFIX = "refresh_token:";

const hashForRedis = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export class RefreshTokenService {
  async storeRefreshToken(userId: string, token: string, ttlSecond: number) {
    const client = await getRedisClient();
    const key = `${PREFIX}${userId}`;
    await client.setEx(key, ttlSecond, hashForRedis(token));
    console.log(`✅ Refresh token stored in Redis for user ${userId}`);
  }

  async validateRefreshTokenInRedis(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const client = await getRedisClient();
    const key = `${PREFIX}${userId}`;
    const stored = await client.get(key);
    if (!stored) return false;
    return stored === hashForRedis(token);
  }

  async revokeRefreshTokenInRedis(userId: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(`${PREFIX}${userId}`);
    console.log(`✅ Refresh token removed from Redis for user ${userId}`);
  }

  async storeRefreshTokenInDB(user: User, token: string): Promise<void> {
    user.refreshToken = token;
    await AppDataSource.getRepository(User).save(user);
    console.log(`✅ Refresh token stored in DB for user ${user.id}`);
  }

  async validateRefreshTokenInDB(user: User, token: string): Promise<boolean> {
    if (!user.refreshToken) return false;
    return await bcrypt.compare(token, user.refreshToken);
  }

  async revokeRefreshTokenInDB(user: User): Promise<void> {
    user.refreshToken = null;
    await AppDataSource.getRepository(User).save(user);
    console.log(`✅ Refresh token removed from DB for user ${user.id}`);
  }
}
