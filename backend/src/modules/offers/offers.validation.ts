import { z } from "zod";

const optionalNumber = z.number().min(0).nullable().optional();

export const createPromoCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, digits, - and _ only"),
  description: z.string().trim().max(200).nullable().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive(),
  maxDiscount: optionalNumber,
  minFare: optionalNumber,
  validFrom: z.string().datetime().nullable().optional(),
  validTo: z.string().datetime().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  perClientLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const updatePromoCodeSchema = createPromoCodeSchema
  .omit({ code: true })
  .partial();

export type CreatePromoCodeDTO = z.infer<typeof createPromoCodeSchema>;
export type UpdatePromoCodeDTO = z.infer<typeof updatePromoCodeSchema>;

export const validatePromoSchema = z.object({
  code: z.string().trim().min(1).max(30),
});

export const grantCreditSchema = z
  .object({
    amount: z.number().positive().max(100000),
    reason: z.string().trim().min(1).max(200),
    phone: z.string().trim().min(5).optional(),
    allClients: z.boolean().optional(),
  })
  .refine((d) => d.allClients === true || !!d.phone, {
    message: "phone or allClients is required",
    path: ["phone"],
  });

export type GrantCreditDTO = z.infer<typeof grantCreditSchema>;

export const offerSettingsSchema = z.object({
  cashbackPercent: z.number().min(0).max(100).nullable(),
  welcomeBonusAmount: z.number().min(0).nullable(),
  creditMaxUsagePercent: z.number().int().min(1).max(100),
});

export type OfferSettingsDTO = z.infer<typeof offerSettingsSchema>;
