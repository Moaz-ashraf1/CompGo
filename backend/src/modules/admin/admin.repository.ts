import { prisma } from "../../config/prisma.js";

export const findCaptainById = async (id: string) => {
  return prisma.captain.findUnique({ where: { id } });
};

export const findCaptainByPhone = async (phone: string) => {
  return prisma.captain.findUnique({ where: { phone } });
};

export const findClientById = async (id: string) => {
  return prisma.client.findUnique({ where: { id } });
};

export const updateCaptainPhone = async (id: string, phone: string) => {
  return prisma.captain.update({ where: { id }, data: { phone } });
};

export const updateCaptainPassword = async (
  id: string,
  passwordHash: string,
) => {
  return prisma.captain.update({ where: { id }, data: { passwordHash } });
};

export const updateClientPassword = async (
  id: string,
  passwordHash: string,
) => {
  return prisma.client.update({ where: { id }, data: { passwordHash } });
};
