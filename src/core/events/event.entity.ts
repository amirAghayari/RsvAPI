import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Reservation } from "../reservations/reservation.entity";
import { EventStatus } from "../../utils/event.status";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "integer" })
  price: number;

  @Column({ type: "integer" })
  capacity: number;

  @Column({ type: "timestamp" })
  executionDate: Date;

  @Column({ type: "timestamp" })
  salesStartTime: Date;

  @Column({ type: "timestamp" })
  salesEndTime: Date;

  @Column()
  location: string;

  @Column({
    type: "enum",
    enum: EventStatus,
  })
  status: EventStatus;

  @OneToMany(() => Reservation, (reservation) => reservation.event)
  reservations: Reservation[];
}
