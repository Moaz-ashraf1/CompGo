import { prisma } from "../../../config/prisma.js";

export const findAdminByUsername = async (username: string) => {
  return prisma.admin.findUnique({ where: { username } });
};
