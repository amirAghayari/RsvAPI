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
import { PaymentStatus } from "../../utils/payment.status";
import { PaymentGateway } from "../../utils/payment.gatewey";

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
    type: "bigint",
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
    nullable: true,
  })
  authority: string;

  @Index({ unique: true })
  @Column({
    nullable: true,
  })
  refId: string;

  @Column({
    nullable: true,
  })
  cardPan: string;

  @Column({
    nullable: true,
  })
  feeType: string;

  @Column({
    type: "integer",
    nullable: true,
  })
  fee: number;

  @Column({
    type: "timestamp",
    nullable: true,
  })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
