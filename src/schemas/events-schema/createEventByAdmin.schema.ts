import z from "zod";

export const createEventByAdminSchema = z.object({
  userId: z.string().min(1, "User ID is required"),

  title: z
    .string()
    .min(4, "Event title required ")
    .max(50, "The title cannot be longer than 50 characters."),
  price: z
    .number("The price of a numeric field is")
    .min(1, "The price is required"),
  location: z.string().min(4, "Event location required "),
  capacity: z.number("The capacity of a numeric field is").min(5),
  executionDate: z.date(),
  salesStartTime: z.date(),
  salesEndTime: z.date(),
});
