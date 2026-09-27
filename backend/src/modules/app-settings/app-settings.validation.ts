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
});

export type UpdateAppSettingsDto = z.infer<typeof updateAppSettingsSchema>;
