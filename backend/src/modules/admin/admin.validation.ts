import { z } from "zod";

export const updateCaptainPhoneSchema = z.object({
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type UpdateCaptainPhoneDTO = z.infer<typeof updateCaptainPhoneSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
