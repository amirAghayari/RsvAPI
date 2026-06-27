export enum ReservationStatus {
  PENDING = "pending",
  PAID = "paid",
  CONFIRMED = "confirmed",
  CANCELED = "canceled",
  EXPIRED = " expired",
}

export enum LogAction {
  RESERVE = "reserve",
  CANCEL = "cancel",
  PAY = "pay",
}
