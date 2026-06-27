import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ReservationStatus } from "../../utils/reservation.status";
import { User } from "../users/user.entity";
import { Event } from "../events/event.entity";

// TODO : reservation : update relations , structure
@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column("uuid")
  userId: string;

  @ManyToOne(() => Event, (event) => event.reservations)
  @JoinColumn({ name: "eventId" })
  event: Event;

  @Column("uuid")
  eventId: string;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
