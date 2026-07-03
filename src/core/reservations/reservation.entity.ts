import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { ReservationStatus } from "../../utils/reservation.status";
import { User } from "../users/user.entity";
import { Ticket } from "../tickets/ticket.entity";
import { Payment } from "../payments/payment.entity";

@Index(["userId", "ticketId"], { unique: true })
@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({
    type: "enum",
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ManyToOne(() => User, (user) => user.reservations, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column("uuid")
  userId: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.reservations, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "ticketId" })
  ticket: Ticket;

  @Column("uuid")
  ticketId: string;

  @OneToMany(() => Payment, (payment) => payment.reservation)
  payments: Payment[];

  @Column({
    type: "integer",
    default: 1,
  })
  quantity: number;

  @Index()
  @Column({
    type: "timestamp",
    nullable: true,
  })
  expiresAt: Date;

  @Column({
    type: "timestamp",
    nullable: true,
  })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
