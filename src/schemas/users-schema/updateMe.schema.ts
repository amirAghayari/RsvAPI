import { z } from "zod";

export const updateMeSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email address").optional(),
    avatar: z.string().optional(),
  }),
});
