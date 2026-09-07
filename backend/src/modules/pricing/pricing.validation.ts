import { z } from "zod";

export const updatePricingSchema = z.object({
  rideInsideCompoundPrice: z.number().positive(),
  rideOutsidePricePerKm: z.number().positive(),
  orderInsideCompoundPrice: z.number().positive(),
  airportPrice: z.number().positive(),
  commissionPercentage: z.number().min(0).max(100),
});

export type UpdatePricingDto = z.infer<typeof updatePricingSchema>;
