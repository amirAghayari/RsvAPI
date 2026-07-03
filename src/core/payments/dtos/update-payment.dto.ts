import { PaymentStatus } from "../../../utils/payment.status";
import { ICreatePaymentDto } from "./create-payment.dto";

export interface IUpdatePaymentDto extends Partial<ICreatePaymentDto> {
  status: PaymentStatus;
}
