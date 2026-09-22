import { z } from "zod";

export const updatePricingSchema = z
  .object({
    rideInsideCompoundPrice: z.number().positive(),
    rideOutsidePricePerKm: z.number().positive(),
    orderInsideCompoundPrice: z.number().positive(),
    airportPrice: z.number().positive(),
    commissionPercentage: z.number().min(0).max(100),
    // How a RIDE trip starting outside the compound gets priced (see
    // trip.service.ts -> calculatePrice). Only the field(s) the chosen
    // mode actually uses are required below.
    outsideCompoundMode: z
      .enum(["PER_KM", "FLAT", "THRESHOLD"])
      .default("PER_KM"),
    outsideCompoundFlatPrice: z.number().positive().optional(),
    outsideCompoundBasePrice: z.number().min(0).optional(),
    outsideCompoundThresholdKm: z.number().min(0).optional(),
    // How an ORDER trip covering more than one pickup place gets priced
    // (see trip.service.ts -> calculatePrice).
    orderPlacesMode: z.enum(["FLAT", "PER_PLACE", "TIERED"]).default("FLAT"),
    orderExtraPlacePrice: z.number().min(0).optional(),
    orderPlaceTiers: z
      .array(
        z.object({
          minPlaces: z.number().int().min(2),
          price: z.number().min(0),
        }),
      )
      .optional(),
  })
  .refine(
    (data) =>
      data.outsideCompoundMode !== "FLAT" ||
      data.outsideCompoundFlatPrice !== undefined,
    {
      message: "outsideCompoundFlatPrice is required for FLAT mode",
      path: ["outsideCompoundFlatPrice"],
    },
  )
  .refine(
    (data) =>
      data.outsideCompoundMode !== "THRESHOLD" ||
      (data.outsideCompoundBasePrice !== undefined &&
        data.outsideCompoundThresholdKm !== undefined),
    {
      message:
        "outsideCompoundBasePrice and outsideCompoundThresholdKm are required for THRESHOLD mode",
      path: ["outsideCompoundThresholdKm"],
    },
  )
  .refine(
    (data) =>
      data.orderPlacesMode !== "PER_PLACE" ||
      data.orderExtraPlacePrice !== undefined,
    {
      message: "orderExtraPlacePrice is required for PER_PLACE mode",
      path: ["orderExtraPlacePrice"],
    },
  )
  .refine(
    (data) =>
      data.orderPlacesMode !== "TIERED" ||
      (data.orderPlaceTiers !== undefined && data.orderPlaceTiers.length > 0),
    {
      message: "orderPlaceTiers is required for TIERED mode",
      path: ["orderPlaceTiers"],
    },
  );

export type UpdatePricingDto = z.infer<typeof updatePricingSchema>;
