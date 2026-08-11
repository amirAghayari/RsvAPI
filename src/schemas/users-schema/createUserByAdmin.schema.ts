import { z } from "zod";
import { passwordValidationSchema } from "./passwordValidation.schema";

export const createUserByAdminSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      avatar: z.string().optional(),
    })
    .merge(passwordValidationSchema),
});
