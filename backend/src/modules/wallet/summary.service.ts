import { prisma } from "../../config/prisma.js";
import * as pricingRepo from "../pricing/pricing.repository.js";
import {
  tripCompanyShare,
  type CommissionCategory,
  type CommissionRules,
} from "../../utils/commission.js";
import { METHOD_LABELS } from "./transfers.service.js";

const round2 = (n: number) => Math.round(n * 100) / 100;

const CATEGORIES: { key: CommissionCategory; label: string }[] = [
  { key: "RIDE_OUTSIDE", label: "رحلة خارجية" },
  { key: "RIDE_INSIDE", label: "رحلة داخلية" },
  { key: "ORDER", label: "طلبات" },
  { key: "AIRPORT", label: "مطار" },
];

const categoryOf = (trip: {
  type: string;
  isInsideCompound: boolean;
}): CommissionCategory => {
  if (trip.type === "AIRPORT") return "AIRPORT";
  if (trip.type === "ORDER") return "ORDER";
  return trip.isInsideCompound ? "RIDE_INSIDE" : "RIDE_OUTSIDE";
};

/// The company's cut as the admin configured it, in words.
const rateLabel = (
  rules: CommissionRules | null,
  category: CommissionCategory,
  fallbackPercent: number,
) => {
  const rule = rules?.[category];
  if (!rule) return `${fallbackPercent}%`;
  const base = rule.mode === "PERCENT" ? `${rule.value}%` : `${rule.value} ج.م / رحلة`;
  return rule.onTop ? `${base} (فوق السعر)` : base;
};

/// Everything the dashboard's captain wallet panel shows: the balance split
/// (remaining / transferred / total due), the period's earnings with a
/// per-service breakdown, the company rates, and the transfers log.
export const getCaptainWalletSummary = async (
  captainId: string,
  range: { from?: Date; to?: Date },
) => {
  const [captain, pricing] = await Promise.all([
    prisma.captain.findUnique({
      where: { id: captainId },
      select: { amountDue: true, lastSettledAt: true, createdAt: true },
    }),
    pricingRepo.findPricingConfig(),
  ]);
  if (!captain) return null;

  const rules = (pricing?.commissionRules as CommissionRules | null) ?? null;
  const fallbackPercent = Number(pricing?.commissionPercentage ?? 0);

  const [trips, transfers] = await Promise.all([
    prisma.trip.findMany({
      where: {
        captainId,
        status: "COMPLETED",
        completedAt: {
          not: null,
          ...(range.from ? { gte: range.from } : {}),
          ...(range.to ? { lte: range.to } : {}),
        },
      },
      select: {
        type: true,
        isInsideCompound: true,
        price: true,
        companyShare: true,
      },
    }),
    prisma.walletTransaction.findMany({
      where: { captainId, kind: "COLLECTION", reversalOfId: null },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const services = CATEGORIES.map(({ key, label }) => {
    const mine = trips.filter((t) => categoryOf(t) === key);
    const totalValue = mine.reduce((s, t) => s + Number(t.price), 0);
    const companyShare = mine.reduce(
      (s, t) => s + tripCompanyShare(t, fallbackPercent),
      0,
    );
    return {
      category: key,
      label,
      rate: rateLabel(rules, key, fallbackPercent),
      trips: mine.length,
      totalValue: round2(totalValue),
      companyShare: round2(companyShare),
      captainEarnings: round2(totalValue - companyShare),
    };
  });

  const period = {
    trips: services.reduce((s, x) => s + x.trips, 0),
    totalValue: round2(services.reduce((s, x) => s + x.totalValue, 0)),
    companyShare: round2(services.reduce((s, x) => s + x.companyShare, 0)),
    captainEarnings: round2(services.reduce((s, x) => s + x.captainEarnings, 0)),
  };

  // The collection cycle restarts whenever the balance is settled to zero, so
  // "transferred" only counts payments since then.
  const cycleStart = captain.lastSettledAt ?? captain.createdAt;
  const transferred = round2(
    transfers
      .filter((t) => !t.cancelledAt && t.createdAt > cycleStart)
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
  );
  const remaining = round2(Number(captain.amountDue));

  return {
    balance: { remaining, transferred, totalDue: round2(remaining + transferred) },
    period,
    services,
    transfers: transfers.map((t) => ({
      id: t.id,
      amount: Math.abs(Number(t.amount)),
      method: t.method,
      methodLabel: t.method ? (METHOD_LABELS[t.method] ?? t.method) : null,
      note: t.note,
      reason: t.reason,
      createdAt: t.createdAt,
      cancelledAt: t.cancelledAt,
    })),
  };
};
