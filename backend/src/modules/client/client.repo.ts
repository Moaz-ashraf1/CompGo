import { prisma } from "../../config/prisma.js";

export const findClientById = async (id: string) => {
  return prisma.client.findUnique({ where: { id } });
};

export const findClientByPhone = async (phone: string) => {
  return prisma.client.findUnique({ where: { phone } });
};

export const updateClient = async (
  id: string,
  data: { name?: string; phone?: string },
) => {
  return prisma.client.update({ where: { id }, data });
};

export const findAllClients = async () => {
  return prisma.client.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      gender: true,
      status: true,
      tripNum: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};
