import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Reservation } from "./reservation.entity";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "integer" })
  totalCapacity: number;

  @Column({ type: "integer" })
  remainingTickets: number;

  @Column({ type: "integer", default: 0 })
  blockedTickets: number;

  @Column({ type: "integer", default: 0 })
  soldTickets: number;

  @Column({ type: "timestamp" })
  executionDate: Date;

  @Column({ type: "timestamp" })
  salesStartTime: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.event)
  reservations: Reservation[];
}
