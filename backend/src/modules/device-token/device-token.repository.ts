import { prisma } from "../../config/prisma.js";
import type { AccountRole } from "../../generated/prisma/client.js";

export const upsertDeviceToken = async (data: {
  accountId: string;
  role: AccountRole;
  token: string;
  platform: string;
}) => {
  return prisma.deviceToken.upsert({
    where: { token: data.token },
    create: data,
    update: {
      accountId: data.accountId,
      role: data.role,
      platform: data.platform,
    },
  });
};

export const removeDeviceToken = async (token: string) => {
  await prisma.deviceToken.deleteMany({ where: { token } });
};

export const findTokensByAccountId = async (accountId: string) => {
  return prisma.deviceToken.findMany({
    where: { accountId },
    select: { token: true },
  });
};

export const findAllCaptainTokens = async () => {
  return prisma.deviceToken.findMany({
    where: { role: "CAPTAIN" },
    select: { token: true },
  });
};

/// Called after a push send reports a token as unregistered/invalid (app
/// uninstalled, token rotated) - keeps the table from accumulating dead
/// tokens forever.
export const removeInvalidTokens = async (tokens: string[]) => {
  if (tokens.length === 0) return;
  await prisma.deviceToken.deleteMany({ where: { token: { in: tokens } } });
};
