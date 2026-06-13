import { z } from "zod";

export const updateUserByAdminSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    photo: z.string().optional(),
    active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});
