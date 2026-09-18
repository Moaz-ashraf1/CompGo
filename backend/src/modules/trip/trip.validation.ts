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
