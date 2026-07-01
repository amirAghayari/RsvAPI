import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Reservation } from "../reservations/reservation.entity";
import { Event } from "../events/event.entity";

@Entity("tickets")
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  eventId: string;

  @ManyToOne(() => Event, (event) => event.tickets, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "eventId" })
  event: Event;

  @Column()
  title: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description: string;

  @Column({
    type: "integer",
  })
  price: number;

  @Column({
    type: "integer",
  })
  capacity: number;

  @Column({
    type: "integer",
    default: 0,
  })
  reservedCount: number;

  @Column({
    type: "integer",
    default: 1,
  })
  maxPerUser: number;

  @Column({
    type: "timestamp",
  })
  saleStartsAt: Date;

  @Column({
    type: "timestamp",
  })
  saleEndsAt: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.ticket)
  reservations: Reservation[];
}
