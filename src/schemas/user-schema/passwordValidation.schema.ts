import { z } from "zod";

export const passwordValidationSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Password and confirmation do not match",
    path: ["passwordConfirmation"],
  });
