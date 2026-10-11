import { z } from "zod";

const commissionRuleSchema = z.object({
  mode: z.enum(["FIXED", "PERCENT"]),
  value: z.number().min(0),
  onTop: z.boolean(),
});

export const updatePricingSchema = z
  .object({
    rideInsideCompoundPrice: z.number().positive(),
    rideOutsidePricePerKm: z.number().positive(),
    orderInsideCompoundPrice: z.number().positive(),
    // Price for an ORDER trip whose pickup is outside the compound - falls
    // back to orderInsideCompoundPrice when unset (see
    // trip.service.ts -> calculatePrice).
    orderOutsideCompoundPrice: z.number().positive().optional(),
    airportPrice: z.number().positive(),
    commissionPercentage: z.number().min(0).max(100),
    // How a RIDE trip starting outside the compound gets priced (see
    // trip.service.ts -> calculatePrice). Only the field(s) the chosen
    // mode actually uses are required below.
    outsideCompoundMode: z
      .enum(["PER_KM", "FLAT", "THRESHOLD", "DISTANCE_BANDS"])
      .default("PER_KM"),
    outsideCompoundFlatPrice: z.number().positive().optional(),
    outsideCompoundBasePrice: z.number().min(0).optional(),
    outsideCompoundThresholdKm: z.number().min(0).optional(),
    // DISTANCE_BANDS: rate per km picked by the trip's TOTAL distance.
    outsideBandLimitKm: z.number().positive().nullable().optional(),
    outsideRateNearKm: z.number().min(0).nullable().optional(),
    outsideRateFarKm: z.number().min(0).nullable().optional(),
    // Fixed airport entry fee added to every airport trip; null = the
    // client pays it at the gate (not part of the app's price).
    airportCardFee: z.number().min(0).nullable().optional(),
    // Company share per category - a missing category falls back to
    // commissionPercentage (see utils/commission.ts).
    commissionRules: z
      .object({
        RIDE_INSIDE: commissionRuleSchema.optional(),
        RIDE_OUTSIDE: commissionRuleSchema.optional(),
        AIRPORT: commissionRuleSchema.optional(),
        ORDER: commissionRuleSchema.optional(),
      })
      .optional(),
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
      data.outsideCompoundMode !== "DISTANCE_BANDS" ||
      (data.outsideBandLimitKm != null &&
        data.outsideRateNearKm != null &&
        data.outsideRateFarKm != null),
    {
      message:
        "outsideBandLimitKm, outsideRateNearKm and outsideRateFarKm are required for DISTANCE_BANDS mode",
      path: ["outsideBandLimitKm"],
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
