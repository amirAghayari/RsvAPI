import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Event } from "./event.entity";

export enum ReservationStatus {
  PENDING = "pending",
  PAID = "paid",
  CANCELED = "canceled",
}

@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "integer" })
  numberOfTickets: number;

  @Column({
    type: "enum",
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: "jsonb" }) // for array of {name, family, mobile, nationalCardPhotoPath}
  ticketDetails: any; // بهتره interface تعریف کنی: Array<{name: string, family: string, mobile: string, nationalCardPhoto: string}>

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
