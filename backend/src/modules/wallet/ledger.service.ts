import * as tripRepo from "../trip/trip.repository.js";
import * as captainRepo from "../captain/captain.repository.js";
import * as pricingRepo from "../pricing/pricing.repository.js";
import { tripCompanyShare } from "../../utils/commission.js";

export const LEDGER_TYPES = [
  "TRIP_FARE",
  "PLATFORM_COMMISSION",
  "ADMIN_ADJUSTMENT",
  "PENALTY",
  "COLLECTION",
  "DISCOUNT_COVERED",
] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export const LEDGER_PAGE_SIZE = 20;

interface LedgerEntry {
  type: LedgerType;
  tripId: string | null;
  reason: string | null;
  /// Same sign convention the wallet screen already uses: a trip fare is
  /// money the captain collected (+), everything else is the change in what
  /// they owe the company (positive = owes more, negative = owes less).
  amount: number;
  occurredAt: Date;
}

/// The captain's complete money history in a date range - every trip fare
/// and its commission, plus every manual adjustment, cancellation penalty
/// and collected payment - newest first, filterable by type and paged.
/// `summary` always covers the whole range (ignoring the type filter) so the
/// totals stay meaningful while browsing one type.
export const getCaptainLedger = async (
  captainId: string,
  params: { from?: Date; to?: Date; type?: LedgerType; page?: number },
) => {
  const [trips, walletTransactions, pricing] = await Promise.all([
    tripRepo.findCompletedTripsByCaptainInRange(captainId, params),
    captainRepo.findWalletTransactionsInRange(captainId, params),
    pricingRepo.findPricingConfig(),
  ]);
  const commissionPercentage = pricing?.commissionPercentage ?? 0;

  const entries: LedgerEntry[] = [
    ...trips.flatMap((trip): LedgerEntry[] => {
      const covered =
        Number(trip.discountAmount ?? 0) + Number(trip.creditUsed ?? 0);
      return [
      {
        type: "TRIP_FARE",
        tripId: trip.id,
        reason: null,
        amount: Number(trip.price),
        occurredAt: trip.completedAt!,
      },
      {
        type: "PLATFORM_COMMISSION",
        tripId: trip.id,
        reason: null,
        amount: -tripCompanyShare(trip, commissionPercentage),
        occurredAt: trip.completedAt!,
      },
      // The client paid that much less in cash (promo/credit) - the company
      // takes it off what the captain owes, so it's a credit to them.
      ...(covered > 0
        ? [
            {
              type: "DISCOUNT_COVERED" as const,
              tripId: trip.id,
              reason: "خصم تحمّلته الشركة",
              amount: covered,
              occurredAt: trip.completedAt!,
            },
          ]
        : []),
    ];
    }),
    ...walletTransactions.map((w): LedgerEntry => ({
      type:
        w.kind === "PENALTY"
          ? "PENALTY"
          : w.kind === "COLLECTION"
            ? "COLLECTION"
            : "ADMIN_ADJUSTMENT",
      tripId: null,
      reason: w.reason,
      amount: Number(w.amount),
      occurredAt: w.createdAt,
    })),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  const sum = (type: LedgerType) =>
    entries.filter((e) => e.type === type).reduce((acc, e) => acc + e.amount, 0);
  const round = (n: number) => Math.round(n * 100) / 100;

  const summary = {
    earnings: round(sum("TRIP_FARE")),
    commission: round(Math.abs(sum("PLATFORM_COMMISSION"))),
    penalties: round(sum("PENALTY")),
    adjustments: round(sum("ADMIN_ADJUSTMENT")),
    collected: round(Math.abs(sum("COLLECTION"))),
    companyCovered: round(sum("DISCOUNT_COVERED")),
  };

  const filtered = params.type
    ? entries.filter((e) => e.type === params.type)
    : entries;
  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * LEDGER_PAGE_SIZE;

  return {
    transactions: filtered.slice(start, start + LEDGER_PAGE_SIZE),
    total: filtered.length,
    page,
    pageSize: LEDGER_PAGE_SIZE,
    summary,
  };
};
