import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Reservation } from "./reservation.entity";

@Entity("ticket_details")
export class TicketDetails {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  fullName: string;

  @Column()
  phoneNumber: string;
  @Column()
  picture: string;

  @ManyToOne(() => Reservation, (reservation) => reservation.ticketDetails)
  reservation: Reservation;
}
