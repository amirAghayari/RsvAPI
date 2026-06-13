import { z } from "zod";
import { passwordValidationSchema } from "./passwordValidation.schema";

export const updateMePasswordSchema = z.object({
  body: z
    .object({
      passwordCurrent: z.string().min(1, "Current password is required"),
    })
    .merge(passwordValidationSchema),
});
