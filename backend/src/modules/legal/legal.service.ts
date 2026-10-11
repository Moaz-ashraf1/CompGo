import { prisma } from "../../config/prisma.js";
import { StatusCodes } from "http-status-codes";
import { AppException } from "../../exceptions/AppException.js";
import type { LegalPageKey } from "../../generated/prisma/client.js";
import { LEGAL_DEFAULTS, type LegalSection } from "./legal.defaults.js";
import type { UpdateLegalPageDTO } from "./legal.validation.js";

const KEYS = Object.keys(LEGAL_DEFAULTS) as LegalPageKey[];

export const parseKey = (raw: string): LegalPageKey => {
  if (!KEYS.includes(raw as LegalPageKey)) {
    throw new AppException("Legal page not found", StatusCodes.NOT_FOUND);
  }
  return raw as LegalPageKey;
};

/// What the apps show: the admin's text if they saved one, else the
/// built-in text.
export const getPublic = async (key: LegalPageKey) => {
  const row = await prisma.legalPage.findUnique({ where: { key } });
  return {
    key,
    sections: (row?.sections as LegalSection[] | undefined) ?? LEGAL_DEFAULTS[key],
    updatedAt: row?.updatedAt ?? null,
  };
};

export const getAllForAdmin = async () => {
  const rows = await prisma.legalPage.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return KEYS.map((key) => {
    const row = byKey.get(key);
    return {
      key,
      sections: (row?.sections as LegalSection[] | undefined) ?? LEGAL_DEFAULTS[key],
      isCustom: !!row,
      updatedAt: row?.updatedAt ?? null,
    };
  });
};

export const update = async (key: LegalPageKey, data: UpdateLegalPageDTO) => {
  const row = await prisma.legalPage.upsert({
    where: { key },
    create: { key, sections: data.sections },
    update: { sections: data.sections },
  });
  return { key, sections: row.sections, isCustom: true, updatedAt: row.updatedAt };
};

/// Back to the built-in text.
export const reset = async (key: LegalPageKey) => {
  await prisma.legalPage.deleteMany({ where: { key } });
};
