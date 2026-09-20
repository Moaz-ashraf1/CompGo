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

export const captainPublicSelect = {
  id: true,
  name: true,
  phone: true,
  vehicleType: true,
  vehicleModel: true,
  vehicleNumber: true,
} as const;

/// Batch lookup for attaching public captain info to trip responses
/// (e.g. so a client can see who picked up their trip) - deliberately a
/// narrower projection than `captainSafeSelect` (no status/amountDue/
/// documents/isAvailable).
export const findCaptainsPublicByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];
  return prisma.captain.findMany({
    where: { id: { in: ids } },
    select: captainPublicSelect,
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

/// Only for the change-password flow (needs the current hash to verify
/// against) - never exposed outside captain.service.ts's changePassword.
export const findCaptainAuthById = async (id: string) => {
  return prisma.captain.findUnique({
    where: { id },
    select: { id: true, passwordHash: true },
  });
};

export const updateCaptainPassword = async (
  id: string,
  passwordHash: string,
) => {
  return prisma.captain.update({ where: { id }, data: { passwordHash } });
};

export const updateAvailability = async (id: string, isAvailable: boolean) => {
  return prisma.captain.update({
    where: { id },
    data: { isAvailable },
    select: captainSafeSelect,
  });
};

export const incrementAmountDue = async (id: string, amount: number) => {
  return prisma.captain.update({
    where: { id },
    data: { amountDue: { increment: amount } },
    select: captainSafeSelect,
  });
};
