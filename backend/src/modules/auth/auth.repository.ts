import { prisma } from "../../config/prisma.js";

export const createRefreshToken = async (data: {
  userId: string;
  role: "CLIENT" | "CAPTAIN";
  tokenHash: string;
  familyId: string;
  deviceId: string;
  ipAddress: string;
  expiresAt: Date;
}) => {
  return prisma.refreshToken.create({
    data,
  });
};

export const findRefreshTokenByHash = async (tokenHash: string) => {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
  });
};

export const revokeRefreshToken = async (id: string) => {
  return prisma.refreshToken.update({
    where: { id },
    data: { revoked: true },
  });
};

export const revokeFamily = async (familyId: string) => {
  return prisma.refreshToken.updateMany({
    where: { familyId },
    data: { revoked: true },
  });
};
