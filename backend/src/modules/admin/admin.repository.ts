import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { captainSafeSelect } from "../captain/captain.repository.js";

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
  return prisma.captain.update({
    where: { id },
    data: { phone },
    select: captainSafeSelect,
  });
};

export const findCaptainByVehicleNumber = async (vehicleNumber: string) => {
  return prisma.captain.findUnique({ where: { vehicleNumber } });
};

export const updateCaptainDetails = async (
  id: string,
  data: Prisma.CaptainUpdateInput,
) => {
  return prisma.captain.update({
    where: { id },
    data,
    select: captainSafeSelect,
  });
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

export const updateClientDetails = async (
  id: string,
  data: Prisma.ClientUpdateInput,
) => {
  return prisma.client.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      phone: true,
      gender: true,
      status: true,
      tripNum: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const findClientByPhone = async (phone: string) => {
  return prisma.client.findUnique({ where: { phone } });
};
