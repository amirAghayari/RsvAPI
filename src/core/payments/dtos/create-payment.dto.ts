export interface ICreatePaymentDto {
  reservationId: string;
  userId: string;
  amount: number;
  authority?: string;
  refId?: string;
  cardPan?: string;
  feeType?: string;
  fee?: number;
  paidAt?: Date;
}
