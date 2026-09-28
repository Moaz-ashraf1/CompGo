import { z } from "zod";

export const createSettlementSubmissionSchema = z.object({
  paymentMethod: z.enum(["INSTAPAY", "VODAFONE_CASH"]),
  // Set by attachSettlementScreenshot.js from the uploaded file, not sent
  // by the client directly.
  screenshotUrl: z.string().min(1),
});

export type CreateSettlementSubmissionDTO = z.infer<
  typeof createSettlementSubmissionSchema
>;

export const rejectSettlementSubmissionSchema = z.object({
  reason: z.string().trim().min(1).optional(),
});

export type RejectSettlementSubmissionDTO = z.infer<
  typeof rejectSettlementSubmissionSchema
>;
