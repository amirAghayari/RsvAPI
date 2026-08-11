import { z } from "zod";

export const deleteUserByAdminSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});
