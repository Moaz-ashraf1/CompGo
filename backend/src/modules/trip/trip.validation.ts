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
    // Only a FEMALE client is allowed to set this - enforced server-side
    // in trip.service.ts (requestTrip), never trusted from the client
    // alone.
    femaleCaptainOnly: z.boolean().optional(),
    // How many separate pickup places an ORDER trip combines into one
    // request - drives the PER_PLACE pricing mode (see trip.service.ts ->
    // calculatePrice). Ignored for other trip types.
    placesCount: z.number().int().min(1).max(10).optional(),
    // The individually-checkable places themselves (see TripPlace in
    // schema.prisma) - optional for backward compatibility with an app
    // build that still only sends the flattened `pickupLabel` and
    // `placesCount`. When present, its length should match `placesCount`
    // but that isn't enforced here - trip.service.ts just uses this
    // array's length as the source of truth once given.
    places: z
      .array(
        z.object({
          name: z.string().min(1).max(100),
          details: z.string().max(200).optional(),
        }),
      )
      .min(1)
      .max(10)
      .optional(),
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
