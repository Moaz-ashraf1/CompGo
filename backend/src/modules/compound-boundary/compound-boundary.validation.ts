import {z} from "zod";

export const updateBoundarySchema = z.object({
  points: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
    )
    .min(3, "Polygon must have at least 3 points"),
});

export type UpdateBoundaryDto = z.infer<typeof updateBoundarySchema>;