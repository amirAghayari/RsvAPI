import z from "zod";

const passwordConfirmationSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ["passwordConfirmation"],
  });

export const signupSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email"),
    })
    .merge(passwordConfirmationSchema),
});
