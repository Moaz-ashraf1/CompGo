import { prisma } from "../../config/prisma.js";
import type {
  CreateBonusTierDto,
  UpdateBonusTierDto,
} from "./bonus-tier.validation.js";

export const findAllBonusTiers = async () => {
  return prisma.captainBonusTier.findMany({
    orderBy: { bonusPercentage: "desc" },
  });
};

export const findBonusTierById = async (id: string) => {
  return prisma.captainBonusTier.findUnique({ where: { id } });
};

export const createBonusTier = async (data: CreateBonusTierDto) => {
  return prisma.captainBonusTier.create({ data });
};

export const updateBonusTier = async (
  id: string,
  data: UpdateBonusTierDto,
) => {
  return prisma.captainBonusTier.update({ where: { id }, data });
};

export const deleteBonusTier = async (id: string) => {
  return prisma.captainBonusTier.delete({ where: { id } });
};
