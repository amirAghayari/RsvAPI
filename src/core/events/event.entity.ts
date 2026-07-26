import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  Index,
  JoinColumn,
} from "typeorm";
import { EventStatus } from "./event.status";
import { User } from "../users/user.entity";
import { Ticket } from "../tickets/ticket.entity";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column()
  location: string;

  @Column({ type: "timestamp" })
  startsAt: Date;

  @Column({ type: "timestamp" })
  endsAt: Date;

  @Index()
  @Column({
    type: "enum",
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @Column("uuid")
  userId: string;

  @ManyToOne(() => User, (user) => user.event, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];
}
