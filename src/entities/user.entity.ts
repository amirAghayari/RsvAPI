import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { Reservation } from "./reservation.entity";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  // store hashed refresh token
  @Column({ type: "text", nullable: true, select: false })
  refreshToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const isHashed = /^\$2[aby]\$\d{2}\$/.test(this.password);
      if (!isHashed) {
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
      }
    }
  }
}
