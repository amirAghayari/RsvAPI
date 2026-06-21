import z from "zod";

export const createEventByAdminSchema = z.object({
  name: z
    .string()
    .min(4, "Event name required ")
    .max(50, "The name cannot be longer than 50 characters."),
  totalCapacity: z.number("The capacity of a numeric field is").min(5),
  executionDate: z.date(),
  salesStartTime: z.date(),
});
