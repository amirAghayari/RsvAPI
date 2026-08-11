// tests/factories/payment.factory.ts

import { Payment } from "../../src/core/payments/payment.entity";
import { PaymentStatus } from "../../src/core/payments/payment.status";
import { PaymentGateway } from "../../src/core/payments/payment.gatewey";
import { TestDataSource } from "../helpers/database";

export const paymentsUrl = "/api/V1/payments";

export async function createPayment(data?: Partial<Payment>): Promise<Payment> {
  const repository = TestDataSource.getRepository(Payment);

  const payment = repository.create({
    amount: 100,
    status: PaymentStatus.PENDING,
    gateway: PaymentGateway.ZARINPAL,

    ...data,
  });

  return repository.save(payment);
}
