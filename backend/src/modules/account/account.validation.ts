import { z } from "zod";

/// Self-service account deletion: the app asks for the password again.
export const deleteOwnAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
