import { PaymentStatus } from "../payment.status";
import { ICreatePaymentDto } from "./create-payment.dto";

export interface IUpdatePaymentDto extends Partial<ICreatePaymentDto> {
  status: PaymentStatus;
}
