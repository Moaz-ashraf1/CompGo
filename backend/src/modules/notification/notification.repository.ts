import { prisma } from "../../config/prisma.js";
import type { AccountRole, Prisma } from "../../generated/prisma/client.js";

export const createNotification = async (data: {
  accountId: string;
  role: AccountRole;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}) => {
  return prisma.notification.create({ data });
};

export const createNotificationsForAccounts = async (
  accountIds: string[],
  data: { role: AccountRole; title: string; body: string; data?: Prisma.InputJsonValue },
) => {
  if (accountIds.length === 0) return;
  await prisma.notification.createMany({
    data: accountIds.map((accountId) => ({ accountId, ...data })),
  });
};

export const findByAccountId = async (accountId: string, limit = 50) => {
  return prisma.notification.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

export const countUnread = async (accountId: string) => {
  return prisma.notification.count({ where: { accountId, read: false } });
};

export const markRead = async (id: string, accountId: string) => {
  await prisma.notification.updateMany({
    where: { id, accountId },
    data: { read: true },
  });
};

export const markAllRead = async (accountId: string) => {
  await prisma.notification.updateMany({
    where: { accountId, read: false },
    data: { read: true },
  });
};

/// Platform-wide notification log, optionally filtered by role - powers
/// the dashboard's Notifications page (see notification.service.ts ->
/// getAllForAdmin).
export const findAll = async (params: {
  role?: AccountRole;
  skip: number;
  take: number;
}) => {
  return prisma.notification.findMany({
    where: params.role ? { role: params.role } : {},
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
};

export const countAll = async (params: { role?: AccountRole }) => {
  return prisma.notification.count({
    where: params.role ? { role: params.role } : {},
  });
};
