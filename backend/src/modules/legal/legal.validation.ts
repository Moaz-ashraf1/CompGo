import { z } from "zod";

export const updateLegalPageSchema = z.object({
  sections: z
    .array(
      z.object({
        heading: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(5000),
      }),
    )
    .min(1)
    .max(40),
});

export type UpdateLegalPageDTO = z.infer<typeof updateLegalPageSchema>;
