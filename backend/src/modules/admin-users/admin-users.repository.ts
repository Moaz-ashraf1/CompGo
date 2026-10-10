import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export const adminPublicSelect = {
  id: true,
  username: true,
  isSuper: true,
  permissions: true,
  createdAt: true,
} as const;

export const findAll = () =>
  prisma.admin.findMany({
    select: adminPublicSelect,
    orderBy: { createdAt: "asc" },
  });

export const findById = (id: string) =>
  prisma.admin.findUnique({ where: { id }, select: adminPublicSelect });

export const findByUsername = (username: string) =>
  prisma.admin.findUnique({ where: { username } });

export const create = (data: {
  username: string;
  passwordHash: string;
  permissions: Prisma.InputJsonObject;
}) => prisma.admin.create({ data, select: adminPublicSelect });

export const update = (
  id: string,
  data: { passwordHash?: string; permissions?: Prisma.InputJsonObject },
) => prisma.admin.update({ where: { id }, data, select: adminPublicSelect });

export const remove = (id: string) => prisma.admin.delete({ where: { id } });
