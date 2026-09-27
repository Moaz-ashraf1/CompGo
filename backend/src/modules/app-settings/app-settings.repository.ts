import { prisma } from "../../config/prisma.js";
import type { UpdateAppSettingsDto } from "./app-settings.validation.js";

export const findAppSettings = async () => {
  return prisma.appSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });
};

export const upsertAppSettings = async (data: UpdateAppSettingsDto) => {
  const existing = await prisma.appSettings.findFirst();

  if (existing) {
    return prisma.appSettings.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.appSettings.create({ data });
};
