import { Repository } from "typeorm";
import AppDataSource from "../config/dataSource";
import { User } from "../entities/user.entity";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { AppError } from "../utils/AppError";

export class AuthService {
  private get userRepo(): Repository<User> {
    return AppDataSource.getRepository(User);
  }
  async register(email: string, name: string, password: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

    const user = this.userRepo.create({ email, name, password });
    await this.userRepo.save(user);
    // do not return password or refreshToken
    return { id: user.id, email: user.email, name: user.name };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .addSelect("user.refreshToken")
      .addSelect("user.email")
      .addSelect("user.name")
      .addSelect("user.role")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) throw new AppError("USER_NOT_FOUND", 404);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError("INCORRECT_PASSWORD", 401);

    const payload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // store hashed refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefresh;
    await this.userRepo.save(user);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const userId = payload.userId as string;

      const user = await this.userRepo
        .createQueryBuilder("user")
        .addSelect("user.refreshToken")
        .addSelect("user.role")
        .where("user.id = :id", { id: userId })
        .getOne();

      if (!user || !user.refreshToken) throw new AppError("INVALID_TOKEN", 401);

      const valid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!valid) throw new AppError("INVALID_TOKEN", 401);

      const newPayload = { userId: user.id, role: user.role };
      const accessToken = signAccessToken(newPayload);
      const newRefreshToken = signRefreshToken(newPayload);

      user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
      await this.userRepo.save(user);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new AppError("INVALID_TOKEN", 401);
    }
  }

  async revokeRefreshToken(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    user.refreshToken = null;
    await this.userRepo.save(user);
  }
}

export default new AuthService();
