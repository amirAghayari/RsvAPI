import { z } from "zod";
import { passwordValidationSchema } from "./passwordValidation.schema";

export const updateUserByAdminSchema = z.object({
  body: z
    .object({
      fullName: z.string().optional(),
      email: z.string().email("Invalid email address").optional(),
      avatar: z.string().optional(),
    })
    .merge(passwordValidationSchema),
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});
