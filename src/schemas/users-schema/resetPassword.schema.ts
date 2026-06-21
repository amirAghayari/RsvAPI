import { z } from "zod";
import { passwordValidationSchema } from "./passwordValidation.schema";

export const resetPasswordSchema = z.object({
  body: passwordValidationSchema,
  query: z.object({
    resetToken: z.string().min(1, "Reset token is required"),
  }),
});
