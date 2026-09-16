import { prisma } from "../../config/prisma.js";
import type {
  RegisterCaptainDTO,
  LoginCaptainDTO,
} from "./captain.validation.js";
import { CaptainStatus } from "../../generated/prisma/client.js";

export const captainSafeSelect = {
  id: true,
  name: true,
  phone: true,
  gender: true,
  nationalIdImage: true,
  licenseImage: true,
  vehicleNumber: true,
  vehicleType: true,
  vehicleModel: true,
  amountDue: true,
  status: true,
  isAvailable: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const findCaptainByPhone = async (phone: string) => {
  return prisma.captain.findUnique({
    where: {
      phone,
    },
    select: {
      id: true,
    },
  });
};

export const findAllCaptains = async () => {
  return prisma.captain.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      nationalIdImage: true,
      licenseImage: true,
      vehicleNumber: true,
      vehicleType: true,
      vehicleModel: true,
      amountDue: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findCaptainById = async (id: string) => {
  return prisma.captain.findUnique({
    where: {
      id,
    },
    select: captainSafeSelect,
  });
};

export const updateCaptainStatus = async (
  id: string,
  status: CaptainStatus,
) => {
  return prisma.captain.update({
    where: {
      id,
    },
    data: {
      status,
    },
    select: captainSafeSelect,
  });
};

export const resetCaptainAmountDue = async (id: string) => {
  return prisma.captain.update({
    where: {
      id,
    },
    data: {
      amountDue: 0,
    },
    select: captainSafeSelect,
  });
};

export const updateCaptain = async (
  id: string,
  data: { name?: string; phone?: string },
) => {
  return prisma.captain.update({
    where: { id },
    data,
    select: captainSafeSelect,
  });
};
