import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

import { User } from "../users/user.entity";
import { Reservation } from "../reservations/reservation.entity";
import { PaymentStatus } from "./payment.status";
import { PaymentGateway } from "./payment.gatewey";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  reservationId: string;

  @ManyToOne(() => Reservation, (reservation) => reservation.payments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "reservationId" })
  reservation: Reservation;

  @Column("uuid")
  userId: string;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
  })
  amount: number;

  @Index()
  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: "enum",
    enum: PaymentGateway,
    default: PaymentGateway.ZARINPAL,
  })
  gateway: PaymentGateway;

  @Index({ unique: true })
  @Column({
    type: "varchar",
    nullable: true,
  })
  authority: string | null;

  @Index({ unique: true })
  @Column({
    type: "varchar",
    nullable: true,
  })
  refId: string | null;

  @Column({
    type: "varchar",
    nullable: true,
  })
  cardPan: string | null;

  @Column({
    type: "varchar",
    nullable: true,
  })
  feeType: string | null;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  fee: number | null;

  @Column({
    type: "timestamp",
    nullable: true,
  })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
