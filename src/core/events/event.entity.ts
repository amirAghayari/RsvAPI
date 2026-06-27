import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { Reservation } from "../reservations/reservation.entity";
import { EventStatus } from "../../utils/event.status";
import { User } from "../users/user.entity";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // TODO : del nullable
  @Column({ nullable: true })
  title: string;

  @Column({ type: "integer", nullable: true })
  price: number;

  @Column({ type: "integer", nullable: true })
  capacity: number;

  @Column({ type: "timestamp" })
  executionDate: Date;

  @Column({ type: "timestamp" })
  salesStartTime: Date;

  @Column({ type: "timestamp", nullable: true })
  salesEndTime: Date;

  @Column({ nullable: true })
  location: string;

  @Column({
    type: "enum",
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @ManyToOne(() => User, (user) => user.event)
  user: User;

  @OneToMany(() => Reservation, (reservation) => reservation.event)
  reservations: Reservation[];
}
