import { z } from "zod";

export const createPaymentSchema = z.object({
  body: z
    .object({
      reservationId: z.string().uuid(),
    })
    .strict(),
});
