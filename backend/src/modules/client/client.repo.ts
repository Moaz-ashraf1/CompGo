import { prisma } from "../../config/prisma.js";
import type { ClientStatus } from "../../generated/prisma/client.js";

export const clientSafeSelect = {
  id: true,
  name: true,
  phone: true,
  gender: true,
  status: true,
  tripNum: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const findClientById = async (id: string) => {
  return prisma.client.findUnique({ where: { id }, select: clientSafeSelect });
};

export const clientPublicSelect = {
  id: true,
  name: true,
  phone: true,
} as const;

export const clientNameOnlySelect = {
  id: true,
  name: true,
} as const;

/// Batch lookup for attaching public client info to trip responses (e.g.
/// so a captain can see who they're picking up once assigned).
export const findClientsPublicByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];
  return prisma.client.findMany({
    where: { id: { in: ids } },
    select: clientPublicSelect,
  });
};

/// Same, but name-only (no phone) - used for the list of *unclaimed*
/// available trips, where every captain browsing the list would otherwise
/// see every waiting client's phone number before anyone has accepted.
export const findClientsNameOnlyByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];
  return prisma.client.findMany({
    where: { id: { in: ids } },
    select: clientNameOnlySelect,
  });
};

/// Only for internal auth/uniqueness checks (login, phone-in-use) - keeps
/// returning the full row (including passwordHash) on purpose.
export const findClientByPhone = async (phone: string) => {
  return prisma.client.findUnique({ where: { phone } });
};

/// Only for the change-password flow (needs the current hash to verify
/// against) - never exposed outside client.service.ts's changePassword.
export const findClientAuthById = async (id: string) => {
  return prisma.client.findUnique({
    where: { id },
    select: { id: true, passwordHash: true },
  });
};

export const updateClientPassword = async (
  id: string,
  passwordHash: string,
) => {
  return prisma.client.update({ where: { id }, data: { passwordHash } });
};

export const updateClient = async (
  id: string,
  data: { name?: string; phone?: string },
) => {
  return prisma.client.update({
    where: { id },
    data,
    select: clientSafeSelect,
  });
};

export const updateClientStatus = async (id: string, status: ClientStatus) => {
  return prisma.client.update({
    where: { id },
    data: { status },
    select: clientSafeSelect,
  });
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
