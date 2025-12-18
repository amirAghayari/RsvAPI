import { z } from "zod";

export const TicketDetailsSchema = z.object({
  fullName: z.string().min(3).max(100),
  phoneNumber: z
    .string()
    // iranian number ;)
    .regex(/^(\+98|0)?9\d{9}$/, "Invalid Iranian phone number"),
});

export const CreateReservationSchema = z
  .object({
    eventId: z.string().uuid("Invalid event ID format"),
    ticketCount: z
      .number()
      .min(1)
      .max(3, "You can reserve a maximum of 3 tickets per event."),
    details: z
      .array(TicketDetailsSchema)
      .min(1, "At least one ticket detail is required."),
  })
  .superRefine((data, ctx) => {
    if (data.details.length !== data.ticketCount) {
      ctx.addIssue({
        path: ["details"],
        message: "Number of ticket details must match the ticket count.",
        code: z.ZodIssueCode.custom,
      });
    }
  });

export type ReservationSchema = z.infer<typeof CreateReservationSchema>;
