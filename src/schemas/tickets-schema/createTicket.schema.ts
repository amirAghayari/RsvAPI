import { z } from "zod";

export const createTicketSchema = z
  .object({
    eventId: z.string(),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title cannot exceed 100 characters"),

    description: z
      .string()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),

    price: z
      .number()
      .nonnegative("Price must be zero or positive")
      .max(999999.99, "Price is too high"),

    capacity: z
      .number()
      .int("Capacity must be an integer")
      .positive("Capacity must be greater than 0")
      .max(100000, "Capacity is too large"),

    maxPerUser: z
      .number()
      .int("maxPerUser must be an integer")
      .positive("maxPerUser must be greater than 0")
      .max(1000, "maxPerUser is too large")
      .optional(),

    saleStartsAt: z.coerce
      .date()
      .refine((d) => !isNaN(d.getTime()), "Invalid sale start date"),

    saleEndsAt: z.coerce
      .date()
      .refine((d) => !isNaN(d.getTime()), "Invalid sale end date"),
  })
  .strict() // Reject any undeclared fields
  .refine((data) => data.saleStartsAt < data.saleEndsAt, {
    message: "saleStartsAt must be before saleEndsAt",
    path: ["saleStartsAt"], // error attached to start date field
  });
