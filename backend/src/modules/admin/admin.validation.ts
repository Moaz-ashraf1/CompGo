import { z } from "zod";

export const updateCaptainPhoneSchema = z.object({
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number"),
});

/// Admin edit of any captain detail (pending or already approved). Sent as
/// multipart/form-data so images can be replaced in the same request; every
/// field is optional and only the ones present are changed.
export const updateCaptainDetailsSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number")
      .optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    vehicleNumber: z.string().trim().min(2).max(50).optional(),
    vehicleType: z.enum(["MOTORCYCLE", "CAR", "BICYCLE"]).optional(),
    vehicleModel: z.string().trim().min(2).max(100).optional(),
    profilePhoto: z.string().min(1).optional(),
    nationalIdImage: z.string().min(1).optional(),
    licenseImage: z.string().min(1).optional(),
    vehicleLicenseImage: z.string().min(1).optional(),
    vehiclePhoto: z.string().min(1).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateCaptainDetailsDTO = z.infer<
  typeof updateCaptainDetailsSchema
>;

/// Admin edit of a client's profile. Every field is optional; only the ones
/// present are changed.
export const updateClientDetailsSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number")
      .optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateClientDetailsDTO = z.infer<typeof updateClientDetailsSchema>;

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

export const TRANSFER_METHODS = ["INSTAPAY", "VODAFONE_CASH", "CASH", "OTHER"] as const;

/// A payment the captain made to the company (see wallet/transfers.service.ts).
export const recordCaptainTransferSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(TRANSFER_METHODS),
  note: z.string().trim().max(200).optional(),
});
export type RecordCaptainTransferDTO = z.infer<typeof recordCaptainTransferSchema>;
