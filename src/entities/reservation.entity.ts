import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../core/users/user.entity";
import { Event } from "./event.entity";
import { ReservationStatus } from "../utils/reservation.status";
import { TicketOwner } from "../utils/ticketOwner.interface";

@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "integer" })
  ticketCount: number;

  @Column({
    type: "enum",
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: "jsonb" }) // for array of {name, family, mobile, picture}
  ticketOwner: TicketOwner[];

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

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
