import { z } from "zod";

export const updateClientProfileSchema = z
  .object({
    name: z.string().min(3).max(100).optional(),
    phone: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.phone !== undefined, {
    message: "At least one field (name or phone) must be provided",
  });

export type UpdateClientProfileDTO = z.infer<typeof updateClientProfileSchema>;

export const changeClientPasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ChangeClientPasswordDTO = z.infer<
  typeof changeClientPasswordSchema
>;
