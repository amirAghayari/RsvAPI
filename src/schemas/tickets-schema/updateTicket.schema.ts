import { z } from "zod";

export const updateTicketBodySchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title cannot exceed 100 characters")
      .optional(),

    description: z
      .string()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),

    price: z
      .number()
      .nonnegative("Price must be zero or positive")
      .max(999999.99, "Price is too high")
      .optional(),

    capacity: z
      .number()
      .int("Capacity must be an integer")
      .positive("Capacity must be greater than 0")
      .max(100000, "Capacity is too large")
      .optional(),

    maxPerUser: z
      .number()
      .int("maxPerUser must be an integer")
      .positive("maxPerUser must be greater than 0")
      .max(1000, "maxPerUser is too large")
      .optional(),

    salesStartAt: z.coerce
      .date()
      .refine((d) => !isNaN(d.getTime()), "Invalid sales start date")
      .optional(),

    salesEndAt: z.coerce
      .date()
      .refine((d) => !isNaN(d.getTime()), "Invalid sales end date")
      .optional(),
  })
  .strict() // Reject any extra fields
  .refine(
    (data) => {
      // If both dates are provided, ensure salesStartAt < salesEndAt
      if (data.salesStartAt && data.salesEndAt) {
        return data.salesStartAt < data.salesEndAt;
      }
      return true;
    },
    {
      message: "salesStartAt must be before salesEndAt",
      path: ["salesStartAt"], // error will be attached to salesStartAt
    },
  );

export const updateTicketSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: updateTicketBodySchema,
});
