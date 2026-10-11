import * as repo from "./offers.repository.js";
import {
  PromoCodeInvalidError,
  PromoCodeNotFoundError,
  PromoCodeTakenError,
} from "../../exceptions/offers.exceptions.js";
import type { PromoCode } from "../../generated/prisma/client.js";
import type {
  CreatePromoCodeDTO,
  UpdatePromoCodeDTO,
} from "./offers.validation.js";

const round2 = (n: number) => Math.round(n * 100) / 100;

export const normalizeCode = (code: string) => code.trim().toUpperCase();

/// Everything about whether a client may use a code right now. `fare` is
/// optional: the pre-check in the app doesn't know the price yet, the
/// real check at request time does (for minFare).
export const validateForClient = async (
  clientId: string,
  rawCode: string,
  fare?: number,
): Promise<PromoCode> => {
  const promo = await repo.findPromoCodeByCode(normalizeCode(rawCode));
  if (!promo || !promo.isActive) throw new PromoCodeInvalidError();

  const now = new Date();
  if (promo.validFrom && promo.validFrom > now) {
    throw new PromoCodeInvalidError("كود الخصم لسه مبدأش");
  }
  if (promo.validTo && promo.validTo < now) {
    throw new PromoCodeInvalidError("كود الخصم انتهت صلاحيته");
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    throw new PromoCodeInvalidError("كود الخصم خلص عدد استخداماته");
  }
  const used = await repo.countClientRedemptions(promo.id, clientId);
  if (used >= promo.perClientLimit) {
    throw new PromoCodeInvalidError("انت استخدمت الكود ده قبل كده");
  }
  if (
    fare !== undefined &&
    promo.minFare !== null &&
    fare < Number(promo.minFare)
  ) {
    throw new PromoCodeInvalidError(
      `الكود ده بيتطبق على رحلات من ${Number(promo.minFare)} ج.م فأكتر`,
    );
  }
  return promo;
};

export const computeDiscount = (promo: PromoCode, fare: number) => {
  const raw =
    promo.discountType === "FIXED"
      ? Number(promo.value)
      : fare * (Number(promo.value) / 100);
  const capped =
    promo.maxDiscount !== null ? Math.min(raw, Number(promo.maxDiscount)) : raw;
  return round2(Math.min(capped, fare));
};

/// Short Arabic description the app can show next to a validated code.
export const describe = (promo: PromoCode) => {
  const base =
    promo.discountType === "FIXED"
      ? `خصم ${Number(promo.value)} ج.م`
      : `خصم ${Number(promo.value)}%`;
  const cap =
    promo.discountType === "PERCENT" && promo.maxDiscount !== null
      ? ` (حد أقصى ${Number(promo.maxDiscount)} ج.م)`
      : "";
  return base + cap;
};

export const validateForApp = async (clientId: string, code: string) => {
  const promo = await validateForClient(clientId, code);
  return {
    code: promo.code,
    description: describe(promo),
    discountType: promo.discountType,
    value: Number(promo.value),
    maxDiscount: promo.maxDiscount === null ? null : Number(promo.maxDiscount),
    minFare: promo.minFare === null ? null : Number(promo.minFare),
  };
};

// ----- admin -----

export const getAll = () => repo.findAllPromoCodes();

const toData = (data: CreatePromoCodeDTO | UpdatePromoCodeDTO) => ({
  ...("code" in data && data.code ? { code: normalizeCode(data.code) } : {}),
  ...(data.description !== undefined ? { description: data.description } : {}),
  ...(data.discountType ? { discountType: data.discountType } : {}),
  ...(data.value !== undefined ? { value: data.value } : {}),
  ...(data.maxDiscount !== undefined ? { maxDiscount: data.maxDiscount } : {}),
  ...(data.minFare !== undefined ? { minFare: data.minFare } : {}),
  ...(data.validFrom !== undefined
    ? { validFrom: data.validFrom ? new Date(data.validFrom) : null }
    : {}),
  ...(data.validTo !== undefined
    ? { validTo: data.validTo ? new Date(data.validTo) : null }
    : {}),
  ...(data.maxUses !== undefined ? { maxUses: data.maxUses } : {}),
  ...(data.perClientLimit !== undefined
    ? { perClientLimit: data.perClientLimit }
    : {}),
  ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
});

export const create = async (data: CreatePromoCodeDTO) => {
  if (await repo.findPromoCodeByCode(normalizeCode(data.code))) {
    throw new PromoCodeTakenError();
  }
  return repo.createPromoCode({
    ...toData(data),
    code: normalizeCode(data.code),
    discountType: data.discountType,
    value: data.value,
  });
};

export const update = async (id: string, data: UpdatePromoCodeDTO) => {
  if (!(await repo.findPromoCodeById(id))) throw new PromoCodeNotFoundError();
  return repo.updatePromoCode(id, toData(data));
};

/// A code that was already used stays (its history and the trips that
/// reference it still matter) - turn it off instead.
export const remove = async (id: string) => {
  const promo = await repo.findPromoCodeById(id);
  if (!promo) throw new PromoCodeNotFoundError();
  if (promo.usedCount > 0) {
    return repo.updatePromoCode(id, { isActive: false });
  }
  await repo.deletePromoCode(id);
  return null;
};
