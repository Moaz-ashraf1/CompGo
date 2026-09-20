import { z } from "zod";

export const createTripSchema = z
  .object({
    type: z.enum(["RIDE", "ORDER", "AIRPORT"]),
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    pickupLabel: z.string().min(2).max(150),
    dropoffLat: z.number().min(-90).max(90).optional(),
    dropoffLng: z.number().min(-180).max(180).optional(),
    dropoffLabel: z.string().min(2).max(150).optional(),
    paymentMethod: z.enum(["CASH", "INSTAPAY", "WALLET"]).optional(),
    // Advance-booking details - currently accepted and stored, but the
    // trip is still matched immediately on request (no scheduler holds it
    // until scheduledAt yet). Only meaningful for AIRPORT trips.
    scheduledAt: z.coerce.date().optional(),
    passengers: z.number().int().min(1).max(20).optional(),
    luggageCount: z.number().int().min(0).max(20).optional(),
    flightNumber: z.string().max(20).optional(),
  })
  .refine(
    (data) =>
      (data.dropoffLat === undefined) === (data.dropoffLng === undefined),
    { message: "dropoffLat and dropoffLng must be provided together" },
  )
  .refine(
    (data) => data.type === "AIRPORT" || data.dropoffLabel !== undefined,
    {
      message: "dropoffLabel is required for RIDE and ORDER trips",
    },
  );

export type CreateTripDTO = z.infer<typeof createTripSchema>;

export const cancelTripSchema = z.object({
  reason: z.string().min(3).max(255).optional(),
});

export type CancelTripDTO = z.infer<typeof cancelTripSchema>;

export const rateTripSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export type RateTripDTO = z.infer<typeof rateTripSchema>;
