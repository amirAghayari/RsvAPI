import { z } from "zod";

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email address").optional(),
    photo: z.string().optional(),
  }),
});
