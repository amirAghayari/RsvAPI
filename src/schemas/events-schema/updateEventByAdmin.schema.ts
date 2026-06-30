import z from "zod";

// TODO

export const updateEventByAdminSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
    // TODO : look this
    status: z.string(
      "status must be draft , published , canceled , finished or sold_out",
    ),
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
  }),
  params: z.object({
    id: z.string().min(1, "Event ID is required"),
  }),
});
