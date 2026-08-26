import { z } from "zod";

export const registerClientSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number"),
  gender: z.enum(["MALE", "FEMALE"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginClientSchema = z.object({
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterClientDTO = z.infer<typeof registerClientSchema>;
export type LoginClientDTO = z.infer<typeof loginClientSchema>;
