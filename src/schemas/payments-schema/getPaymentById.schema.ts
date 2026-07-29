import { z } from "zod";

export const getPaymentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
