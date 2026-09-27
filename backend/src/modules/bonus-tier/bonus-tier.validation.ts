import { z } from "zod";

export const createBonusTierSchema = z.object({
  label: z.string().min(2).max(100),
  minInsideTrips: z.number().int().min(0).default(0),
  minOutsideTrips: z.number().int().min(0).default(0),
  minAvgRating: z.number().min(1).max(5).nullable().optional(),
  maxCancellations: z.number().int().min(0).nullable().optional(),
  bonusPercentage: z.number().min(0).max(100),
});

export type CreateBonusTierDto = z.infer<typeof createBonusTierSchema>;

export const updateBonusTierSchema = createBonusTierSchema.partial();

export type UpdateBonusTierDto = z.infer<typeof updateBonusTierSchema>;
