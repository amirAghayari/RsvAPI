import { z } from "zod";

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title cannot exceed 100 characters"),

    description: z
      .string()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),

    location: z
      .string()
      .min(2, "Location must be at least 2 characters")
      .max(200, "Location cannot exceed 200 characters"),

    startsAt: z.coerce
      .date()
      .refine((d) => !isNaN(d.getTime()), "Invalid start date"),

    endsAt: z.coerce
      .date()
      .refine((d) => !isNaN(d.getTime()), "Invalid end date"),
  })
  .strict() // Prevent extra fields
  .refine((data) => data.startsAt < data.endsAt, {
    message: "startsAt must be before endsAt",
    path: ["startsAt"], // error attached to startsAt field
  })
  .refine((data) => data.startsAt > new Date(), {
    message: "Event start date must be in the future",
    path: ["startsAt"],
  }); // optional future check – remove if not desired
