import { z } from "zod";

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});
