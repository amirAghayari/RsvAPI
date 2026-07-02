import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import bcrypt, { compare, genSalt } from "bcryptjs";
import { Reservation } from "../reservations/reservation.entity";
import { Event } from "../events/event.entity";
import crypto from "node:crypto";
import ms from "ms";
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  // TODO : delete nullable
  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  avatarPublicId?: string;

  @Column({ select: false })
  password: string;

  // This field not save in DB its only use for validation
  passwordConfirmation: string;

  // store hashed refresh token
  @Column({ type: "text", nullable: true, select: false })
  refreshToken: string | null;

  @Column({ type: "text", nullable: true, select: false })
  passwordResetToken: string | null;

  @Column({ type: "timestamp", nullable: true, select: false })
  passwordResetExpires: Date | null;

  @Column({
    type: "enum",
    enum: ["user", "admin"],
    default: "user",
  })
  role: "user" | "admin";

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @OneToMany(() => Event, (event) => event.user)
  event: Event[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    const saltRound = parseInt(process.env.BYCRYPT_SALT_ROUNDS || "10");
    const salt = await genSalt(saltRound);

    if (this.password) {
      const isHashed = /^\$2[aby]\$\d{2}\$/.test(this.password);
      if (!isHashed) {
        this.password = await bcrypt.hash(this.password, salt);
      }
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashRefreshToken() {
    const saltRound = parseInt(process.env.BYCRYPT_SALT_ROUNDS || "10");
    const salt = await genSalt(saltRound);

    if (this.refreshToken) {
      const isHashed = /^\$2[aby]\$\d{2}\$/.test(this.refreshToken);
      if (!isHashed) {
        this.refreshToken = await bcrypt.hash(this.refreshToken, salt);
      }
    }
  }

  async correctPassword(plainPassword: string): Promise<boolean> {
    if (!this.password) return false;
    return compare(plainPassword, this.password);
  }

  async createPasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    this.passwordResetExpires = new Date(
      Date.now() + ms(process.env.PASSWORD_RESET_EXPIRES_IN as ms.StringValue),
    );

    return resetToken;
  }
}
