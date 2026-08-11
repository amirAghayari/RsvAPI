import { Reservation } from "../../src/core/reservations/reservation.entity";
import { ReservationStatus } from "../../src/core/reservations/reservation.status";
import { TestDataSource } from "../helpers/database";

export const reservationsUrl = "/api/V1/reservations";

export async function createReservation(
  data?: Partial<Reservation>,
): Promise<Reservation> {
  const repository = TestDataSource.getRepository(Reservation);

  const reservation = repository.create({
    status: ReservationStatus.PENDING,
    quantity: 1,
    expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 min

    ...data,
  });

  return repository.save(reservation);
}
