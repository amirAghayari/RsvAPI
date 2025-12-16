import { Repository } from "typeorm";
import AppDataSource from "../config/dataSource";
import { User } from "../entities/user.entity";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

const PASSWORD_REGEX = /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]+$/;

export class AuthService {
  private userRepo: Repository<User>;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
  }

  async register(email: string, name: string, password: string) {
    if (!PASSWORD_REGEX.test(password)) {
      throw new Error(
        "Password must be at least 8 chars, contain upper and lower letters and a number, and only letters and digits"
      );
    }

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new Error("Email already in use");

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
      .where("user.email = :email", { email })
      .getOne();

    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    const payload = { userId: user.id };
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
        .where("user.id = :id", { id: userId })
        .getOne();

      if (!user || !user.refreshToken) throw new Error("Invalid token");

      const valid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!valid) throw new Error("Invalid token");

      const newPayload = { userId: user.id };
      const accessToken = signAccessToken(newPayload);
      const newRefreshToken = signRefreshToken(newPayload);

      user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
      await this.userRepo.save(user);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new Error("Invalid token");
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
