import { z } from "zod";
import { ADMIN_SECTIONS } from "../../utils/adminPermissions.js";

const permissionsSchema = z.partialRecord(
  z.enum(ADMIN_SECTIONS),
  z.enum(["VIEW", "EDIT"]),
);

export const createAdminUserSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(8).max(100),
  permissions: permissionsSchema,
});

export const updateAdminUserSchema = z.object({
  password: z.string().min(8).max(100).optional(),
  permissions: permissionsSchema.optional(),
});

export type CreateAdminUserDTO = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserDTO = z.infer<typeof updateAdminUserSchema>;
