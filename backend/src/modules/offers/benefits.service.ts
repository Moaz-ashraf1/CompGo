import * as repo from "./offers.repository.js";
import * as promoService from "./promo.service.js";
import { addCredit } from "./credit.service.js";
import { InsufficientCreditError, PromoCodeInvalidError } from "../../exceptions/offers.exceptions.js";
import { notifyAccount } from "../notification/notification.service.js";
import type { PromoCode } from "../../generated/prisma/client.js";

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface BenefitsPlan {
  promo: PromoCode | null;
  discountAmount: number;
  creditUsed: number;
}

export const NO_BENEFITS: BenefitsPlan = {
  promo: null,
  discountAmount: 0,
  creditUsed: 0,
};

/// Works out (without changing anything) what a promo code and/or bonus
/// credit take off a fare: the code first, then credit on what's left, up
/// to the admin's usage cap. Throws if the code can't be used.
export const planBenefits = async (
  clientId: string,
  fare: number,
  opts: { promoCode?: string; useCredit?: boolean },
): Promise<BenefitsPlan> => {
  let promo: PromoCode | null = null;
  let discountAmount = 0;
  if (opts.promoCode) {
    promo = await promoService.validateForClient(clientId, opts.promoCode, fare);
    discountAmount = promoService.computeDiscount(promo, fare);
  }

  let creditUsed = 0;
  if (opts.useCredit) {
    const [credit, settings] = await Promise.all([
      repo.findClientCredit(clientId),
      repo.findOfferSettings(),
    ]);
    const balance = Number(credit?.creditBalance ?? 0);
    const maxPercent = settings?.creditMaxUsagePercent ?? 100;
    const cap = round2((fare - discountAmount) * (maxPercent / 100));
    creditUsed = round2(Math.max(0, Math.min(balance, cap)));
  }
  return { promo, discountAmount, creditUsed };
};

/// Locks in the plan's promo use and credit atomically (each guarded
/// against a simultaneous request spending the same thing). Returns an
/// undo for when the trip then fails to save.
export const reserveBenefits = async (clientId: string, plan: BenefitsPlan) => {
  const undo: (() => Promise<unknown>)[] = [];
  const release = async () => {
    for (const fn of undo.reverse()) await fn();
  };
  try {
    if (plan.promo) {
      if (!(await repo.tryReservePromoUse(plan.promo.id))) {
        throw new PromoCodeInvalidError("كود الخصم خلص عدد استخداماته");
      }
      const promoId = plan.promo.id;
      undo.push(() => repo.releasePromoUse(promoId));
    }
    if (plan.creditUsed > 0) {
      if (!(await repo.tryReserveCredit(clientId, plan.creditUsed))) {
        throw new InsufficientCreditError();
      }
      undo.push(() => repo.restoreCredit(clientId, plan.creditUsed));
    }
  } catch (err) {
    await release();
    throw err;
  }
  return release;
};

/// Writes the audit rows once the trip has an id.
export const recordBenefits = async (
  clientId: string,
  tripId: string,
  plan: BenefitsPlan,
) => {
  if (plan.promo) {
    await repo.createPromoRedemption({
      promoCodeId: plan.promo.id,
      clientId,
      tripId,
      discount: plan.discountAmount,
    });
  }
  if (plan.creditUsed > 0) {
    await repo.recordCreditTransaction({
      clientId,
      amount: -plan.creditUsed,
      kind: "REDEMPTION",
      reason: "استخدام رصيد في رحلة",
      tripId,
    });
  }
};

/// A trip that never completes gives back what it took: the credit goes
/// back to the client and the promo use is freed.
export const refundTripBenefits = async (trip: {
  id: string;
  clientId: string;
  creditUsed: unknown;
  promoCodeId: string | null;
}) => {
  const credit = Number(trip.creditUsed ?? 0);
  if (credit > 0) {
    await addCredit(
      trip.clientId,
      credit,
      "REFUND",
      "استرجاع رصيد رحلة ملغية",
      trip.id,
    );
  }
  if (trip.promoCodeId) {
    const redemption = await repo.findPromoRedemptionByTrip(trip.id);
    if (redemption) {
      await repo.deletePromoRedemption(redemption.id);
      await repo.releasePromoUse(trip.promoCodeId);
    }
  }
};

/// Cashback on a completed trip - a share of what the client actually paid
/// in cash (not the part covered by a code or credit) goes back as credit.
export const awardCashback = async (trip: {
  id: string;
  clientId: string;
  price: unknown;
  discountAmount: unknown;
  creditUsed: unknown;
}) => {
  const settings = await repo.findOfferSettings();
  const percent = Number(settings?.cashbackPercent ?? 0);
  if (percent <= 0) return;

  const paid =
    Number(trip.price) -
    Number(trip.discountAmount ?? 0) -
    Number(trip.creditUsed ?? 0);
  const cashback = round2(paid * (percent / 100));
  if (cashback <= 0) return;

  await addCredit(
    trip.clientId,
    cashback,
    "CASHBACK",
    `مكافأة رحلة (${percent}%)`,
    trip.id,
  );
  void notifyAccount(trip.clientId, "CLIENT", {
    title: "كسبت رصيد",
    body: `اتضاف ${cashback} ج.م لرصيدك بعد رحلتك`,
    data: { type: "credit:added" },
  });
};
