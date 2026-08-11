import { z } from "zod";
import { EventStatus } from "../../core/events/event.status";

const updateEventBodySchema = z
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

    location: z
      .string()
      .min(2, "Location must be at least 2 characters")
      .max(200, "Location cannot exceed 200 characters")
      .optional(),

    startsAt: z.coerce
      .date()
      .refine((d) => !isNaN(d.getTime()), "Invalid start date")
      .optional(),

    endsAt: z.coerce
      .date()
      .refine((d) => !isNaN(d.getTime()), "Invalid end date")
      .optional(),

    status: z
      .nativeEnum(EventStatus, {
        error: () => ({ message: "Invalid event status value" }),
      })
      .optional(),
  })
  .strict() // Reject extra fields
  .refine(
    (data) => {
      // If both dates are provided, ensure startsAt < endsAt
      if (data.startsAt && data.endsAt) {
        return data.startsAt < data.endsAt;
      }
      return true;
    },
    {
      message: "startsAt must be before endsAt",
      path: ["startsAt"],
    },
  )
  .refine(
    (data) => {
      // Optional: if startsAt is provided, ensure it's in the future
      // (remove if you allow past dates on update)
      if (data.startsAt) {
        return data.startsAt > new Date();
      }
      return true;
    },
    {
      message: "Event start date must be in the future",
      path: ["startsAt"],
    },
  );

export const updateEventSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: updateEventBodySchema,
});
