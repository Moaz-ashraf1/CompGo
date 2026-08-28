import { prisma } from "../../../config/prisma.js";

export const findClientByPhone = async (phone: string) => {
  return prisma.client.findUnique({ where: { phone } });
};

export const createClient = async (data: {
  name: string;
  phone: string;
  gender: "MALE" | "FEMALE";
  passwordHash: string;
}) => {
  return prisma.client.create({ data });
};
