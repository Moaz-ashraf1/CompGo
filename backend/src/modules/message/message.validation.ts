import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(1000),
});

export type SendMessageDTO = z.infer<typeof sendMessageSchema>;
