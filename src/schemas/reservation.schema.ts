import { z } from "zod";

export const TicketDetailsSchema = z.object({
  fullName: z.string().min(3).max(100),
  phoneNumber: z
    .string()
    .regex(/^(\+98|0)?9\d{9}$/, "Invalid Iranian phone number"),
});

export const CreateReservationSchema = z.object({
  eventId: z.string().uuid("Invalid event ID format"),
  ticketCount: z
    .number()
    .min(1)
    .max(3, "You can reserve a maximum of 3 tickets per event."),

  details: z
    .array(TicketDetailsSchema)
    .min(1, "At least one ticket detail is required.")
    // TODO : بررسی ریفاین
    .refine((data, ctx) => data.length === ctx.parent.ticketCount, {
      message: "Number of ticket details must match the ticket count.",
    }),
});

export type ReservationSchema = z.infer<typeof CreateReservationSchema>;
