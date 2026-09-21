import { z } from "zod";

export const updateCaptainPhoneSchema = z.object({
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const resetClientPasswordByPhoneSchema = z.object({
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export const adjustCaptainBalanceSchema = z.object({
  // Positive charges the captain more (e.g. correcting a missed
  // commission), negative pays them out / reduces what they owe - see
  // admin.service.ts -> adjustCaptainBalance.
  amount: z.number().refine((v) => v !== 0, "Amount must not be zero"),
  reason: z.string().min(3).max(255),
});

export type UpdateCaptainPhoneDTO = z.infer<typeof updateCaptainPhoneSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
export type AdjustCaptainBalanceDTO = z.infer<
  typeof adjustCaptainBalanceSchema
>;
