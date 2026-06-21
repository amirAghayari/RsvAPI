import { z } from "zod";
import { passwordValidationSchema } from "./passwordValidation.schema";

export const createUserByAdminSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
    })
    .merge(passwordValidationSchema),
});
