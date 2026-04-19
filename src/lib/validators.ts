import { z } from "zod";

// Sign in schema
export const signInFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Sign up (fields only — used for `.pick()` on register API)
export const signUpFormFieldsSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNo: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(15, { message: "Phone number must be at most 15 digits" })
    .regex(/^[0-9+\-\s()]+$/, { message: "Invalid phone number format" }),
  birthday: z
    .string({ required_error: "Birthday is required" })
    .min(1, { message: "Birthday is required" })
    .refine((s) => !Number.isNaN(new Date(s).getTime()), { message: "Invalid date" })
    .refine((s) => new Date(s).getTime() < Date.now(), { message: "Birthday must be in the past" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters" }),
});

// Full sign-up form (includes confirm password check)
export const signUpFormSchema = signUpFormFieldsSchema.refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

/** Body for `POST /api/auth/register` (no confirmPassword) */
export const registerBodySchema = signUpFormFieldsSchema.pick({
  email: true,
  password: true,
  name: true,
  phoneNo: true,
  birthday: true,
});
