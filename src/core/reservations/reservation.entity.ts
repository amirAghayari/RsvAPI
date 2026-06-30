import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { ReservationStatus } from "../../utils/reservation.status";
import { User } from "../users/user.entity";
import { Event } from "../events/event.entity";

// TODO : reservation : update relations , structure
@Index(["userId", "eventId"], { unique: true })
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

  @ManyToOne(() => User, (user) => user.reservations, { nullable: false })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column("uuid")
  userId: string;

  @ManyToOne(() => Event, (event) => event.reservations)
  @JoinColumn({ name: "eventId" })
  event: Event;

  @Column("uuid")
  eventId: string;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date;

  @Column({ type: "timestamp", nullable: true })
  paidAt: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
