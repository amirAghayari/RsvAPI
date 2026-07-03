export interface ICreatePaymentDto {
  reservationId: string;
  userId: string;
  authority?: string;
  refId?: string;
  cardPan?: string;
  feeType?: string;
  fee?: number;
  paidAt?: Date;
  createdAt: Date;
}
