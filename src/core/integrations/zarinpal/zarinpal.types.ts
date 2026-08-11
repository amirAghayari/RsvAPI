export interface RequestPaymentInput {
  amount: number;
  description: string;
  paymentId: string;
}

export interface RequestPaymentOutput {
  authority: string;
  paymentUrl: string;
}

export interface VerifyPaymentInput {
  authority: string;
  amount: number;
}

export interface VerifyPaymentOutput {
  success: boolean;
  refId?: string;
  cardPan?: string;
  feeType?: string;
  fee?: number;
}
