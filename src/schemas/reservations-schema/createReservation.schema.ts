import z from "zod";

export const createReservationSchema = z
  .object({
    ticketId: z.string(),

    quantity: z
      .number()
      .int("Quantity must be an integer")
      .positive("Quantity must be greater than 0")
      .max(100, "Quantity cannot exceed 100"), // اختیاری
  })
  .strict();
