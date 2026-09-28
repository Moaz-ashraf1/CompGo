import { z } from "zod";

export const updateAppSettingsSchema = z.object({
  // Digits only, international format, no leading +/00/0 - e.g. an
  // Egyptian number "01001234567" becomes "201001234567". `null` clears it
  // (hides the "تواصل معنا" link in both apps).
  supportWhatsappNumber: z
    .string()
    .regex(/^[1-9]\d{7,14}$/, "Must be digits only, international format, no leading 0")
    .nullable(),
  // `null` clears it (hides the email row in both apps).
  supportEmail: z.string().trim().email("Invalid email address").nullable(),
  // Either being null disables the cancellation-penalty policy entirely
  // (see trip.service.ts -> cancelCaptainTrip).
  captainCancellationFreeLimit: z.number().int().min(0).nullable(),
  captainCancellationPenaltyAmount: z.number().min(0).nullable(),
  // Where a captain sends their settlement payment - either being null
  // hides that option in the captain app's payment-method picker.
  instapayNumber: z.string().trim().min(1).nullable(),
  vodafoneCashNumber: z.string().trim().min(1).nullable(),
});

export type UpdateAppSettingsDto = z.infer<typeof updateAppSettingsSchema>;
