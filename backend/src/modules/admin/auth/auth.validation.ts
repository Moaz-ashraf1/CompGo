import { z } from "zod";

export const loginAdminSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

export type LoginAdminDTO = z.infer<typeof loginAdminSchema>;
