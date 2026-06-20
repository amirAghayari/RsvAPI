import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Reservation } from "../reservations/reservation.entity";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "integer" })
  totalCapacity: number;

  @Column({ type: "timestamp" })
  executionDate: Date;

  @Column({ type: "timestamp" })
  salesStartTime: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.event)
  reservations: Reservation[];
}
