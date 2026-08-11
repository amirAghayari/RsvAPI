import { z } from "zod";

export const deletePaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
