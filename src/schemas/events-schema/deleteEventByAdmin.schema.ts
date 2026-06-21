import { z } from "zod";

export const deleteEventByAdminSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Event ID is required"),
  }),
});
