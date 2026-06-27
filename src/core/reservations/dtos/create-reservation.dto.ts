import { ReservationStatus } from "../../../utils/reservation.status";

export interface ICreateReservationDto {
  status: ReservationStatus;
  userId: string;
  eventId: string;
  expiresAt: Date;
  paidAt: Date;
  createdAt: Date;
}
