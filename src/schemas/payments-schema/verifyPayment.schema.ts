import { z } from "zod";

export const verifyPaymentSchema = z.object({
  query: z.object({
    Authority: z.string().min(1),
    Status: z.enum(["OK", "NOK"]),
  }),
});
