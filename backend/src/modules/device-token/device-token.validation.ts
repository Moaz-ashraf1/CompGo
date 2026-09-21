import { z } from "zod";

export const registerDeviceTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(["ios", "android"]),
});

export type RegisterDeviceTokenDTO = z.infer<typeof registerDeviceTokenSchema>;

export const removeDeviceTokenSchema = z.object({
  token: z.string().min(10),
});

export type RemoveDeviceTokenDTO = z.infer<typeof removeDeviceTokenSchema>;
