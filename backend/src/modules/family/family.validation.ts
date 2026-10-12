import { z } from "zod";

const RELATIONS = [
  "FATHER",
  "MOTHER",
  "SON",
  "DAUGHTER",
  "HUSBAND",
  "WIFE",
  "BROTHER",
  "SISTER",
  "OTHER",
] as const;

export const sendFamilyRequestSchema = z.object({
  targetId: z.string().min(1),
  relation: z.enum(RELATIONS),
});

export const respondFamilyRequestSchema = z.object({
  accept: z.boolean(),
});

export type SendFamilyRequestDTO = z.infer<typeof sendFamilyRequestSchema>;
