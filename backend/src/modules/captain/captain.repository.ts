import { prisma } from "../../config/prisma.js";
import type {
  RegisterCaptainDTO,
  LoginCaptainDTO,
} from "./captain.validation.js";
import {
  CaptainStatus,
  WalletTransactionKind,
} from "../../generated/prisma/client.js";

export const captainSafeSelect = {
  id: true,
  name: true,
  phone: true,
  gender: true,
  profilePhoto: true,
  nationalIdImage: true,
  licenseImage: true,
  vehicleLicenseImage: true,
  vehicleNumber: true,
  vehicleType: true,
  vehicleModel: true,
  amountDue: true,
  status: true,
  isAvailable: true,
  settlementCycleDays: true,
  lastSettledAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

/// Just IDs - used to fan a notification out to every captain (see
/// notification.service.ts -> notifyAllCaptains), where the full profile
/// select would be wasted work.
export const findAllCaptainIds = async () => {
  return prisma.captain.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
};

export const findCaptainByPhone = async (phone: string) => {
  return prisma.captain.findUnique({
    where: {
      phone,
    },
    select: {
      id: true,
    },
  });
};

/// Used to fan a `trip:new`/notification out to only the captains eligible
/// to accept a `femaleCaptainOnly` trip (see trip.service.ts ->
/// requestTrip and notification.service.ts -> notifyFemaleCaptains).
export const findFemaleCaptainIds = async () => {
  return prisma.captain.findMany({
    where: { gender: "FEMALE", status: "ACTIVE" },
    select: { id: true },
  });
};

export const findMaleCaptainIds = async () => {
  return prisma.captain.findMany({
    where: { gender: "MALE", status: "ACTIVE" },
    select: { id: true },
  });
};

export const findAllCaptains = async () => {
  return prisma.captain.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      profilePhoto: true,
      nationalIdImage: true,
      licenseImage: true,
      vehicleLicenseImage: true,
      vehicleNumber: true,
      vehicleType: true,
      vehicleModel: true,
      amountDue: true,
      status: true,
      settlementCycleDays: true,
      lastSettledAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/// Newly-registered captains awaiting admin review (see
/// captain.service.ts -> getPendingCaptains) - reuses `captainSafeSelect`
/// since the dashboard's review page needs the same document images the
/// captain detail page already shows.
export const findCaptainsByStatus = async (status: CaptainStatus) => {
  return prisma.captain.findMany({
    where: { status },
    select: captainSafeSelect,
    orderBy: { createdAt: "desc" },
  });
};

export const findCaptainById = async (id: string) => {
  return prisma.captain.findUnique({
    where: {
      id,
    },
    select: captainSafeSelect,
  });
};

export const captainPublicSelect = {
  id: true,
  name: true,
  phone: true,
  profilePhoto: true,
  vehicleType: true,
  vehicleModel: true,
  vehicleNumber: true,
  lastLat: true,
  lastLng: true,
  lastLocationAt: true,
} as const;

/// Batch lookup for attaching public captain info to trip responses
/// (e.g. so a client can see who picked up their trip) - deliberately a
/// narrower projection than `captainSafeSelect` (no status/amountDue/
/// documents/isAvailable).
export const findCaptainsPublicByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];
  return prisma.captain.findMany({
    where: { id: { in: ids } },
    select: captainPublicSelect,
  });
};

export const updateCaptainStatus = async (
  id: string,
  status: CaptainStatus,
) => {
  return prisma.captain.update({
    where: {
      id,
    },
    data: {
      status,
    },
    select: captainSafeSelect,
  });
};

export const resetCaptainAmountDue = async (id: string) => {
  return prisma.captain.update({
    where: {
      id,
    },
    data: {
      amountDue: 0,
      // Resetting dues *is* the settlement/collection event - see
      // Captain.settlementCycleDays for how this feeds the next-due
      // calculation in captain.service.ts -> getSettlementInfo.
      lastSettledAt: new Date(),
    },
    select: captainSafeSelect,
  });
};

export const updateSettlementCycle = async (
  id: string,
  settlementCycleDays: number | null,
) => {
  return prisma.captain.update({
    where: { id },
    data: { settlementCycleDays },
    select: captainSafeSelect,
  });
};

export const updateCaptain = async (
  id: string,
  data: { name?: string; phone?: string },
) => {
  return prisma.captain.update({
    where: { id },
    data,
    select: captainSafeSelect,
  });
};

/// Only for the change-password flow (needs the current hash to verify
/// against) - never exposed outside captain.service.ts's changePassword.
export const findCaptainAuthById = async (id: string) => {
  return prisma.captain.findUnique({
    where: { id },
    select: { id: true, passwordHash: true },
  });
};

export const updateCaptainPassword = async (
  id: string,
  passwordHash: string,
) => {
  return prisma.captain.update({ where: { id }, data: { passwordHash } });
};

/// Called every few seconds by an on-trip captain's foreground location
/// timer - deliberately cheap (no select) since nothing reads the return
/// value.
export const updateCaptainLocation = async (
  id: string,
  lat: number,
  lng: number,
) => {
  await prisma.captain.update({
    where: { id },
    data: { lastLat: lat, lastLng: lng, lastLocationAt: new Date() },
    select: { id: true },
  });
};

export const updateAvailability = async (id: string, isAvailable: boolean) => {
  return prisma.captain.update({
    where: { id },
    data: { isAvailable },
    select: captainSafeSelect,
  });
};

export const incrementAmountDue = async (id: string, amount: number) => {
  return prisma.captain.update({
    where: { id },
    data: { amountDue: { increment: amount } },
    select: captainSafeSelect,
  });
};

/// See WalletTransaction in schema.prisma - a manual admin balance
/// adjustment, kept as its own audit trail alongside the per-trip
/// commission entries already folded into the wallet (see trip.service.ts
/// -> getCaptainWallet, and admin.service.ts -> adjustCaptainBalance).
export const createWalletTransaction = async (
  captainId: string,
  amount: number,
  reason: string,
  kind: WalletTransactionKind = WalletTransactionKind.ADJUSTMENT,
) => {
  return prisma.walletTransaction.create({
    data: { captainId, amount, reason, kind },
  });
};

/// Every wallet transaction for one captain in an optional date range - the
/// non-trip half of their full ledger (see wallet/ledger.service.ts).
export const findWalletTransactionsInRange = async (
  captainId: string,
  params: { from?: Date; to?: Date },
) => {
  return prisma.walletTransaction.findMany({
    where: { captainId, ...walletDateWhere(params) },
    orderBy: { createdAt: "desc" },
  });
};

export const findWalletTransactionsByCaptain = async (
  captainId: string,
  limit = 20,
) => {
  return prisma.walletTransaction.findMany({
    where: { captainId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

/// Platform-wide wallet ledger - every manual admin adjustment across
/// every captain, for the dashboard's Wallet report (see
/// admin.service.ts -> getWalletTransactions). Per-captain history
/// (above) only ever showed one captain at a time.
const walletDateWhere = (params: { from?: Date; to?: Date }) =>
  params.from || params.to
    ? {
        createdAt: {
          ...(params.from ? { gte: params.from } : {}),
          ...(params.to ? { lte: params.to } : {}),
        },
      }
    : {};

type WalletFilters = {
  from?: Date;
  to?: Date;
  captainId?: string;
  kind?: WalletTransactionKind;
};

const walletWhere = (params: WalletFilters) => ({
  ...walletDateWhere(params),
  ...(params.captainId ? { captainId: params.captainId } : {}),
  ...(params.kind ? { kind: params.kind } : {}),
});

export const findAllWalletTransactions = async (
  params: {
    skip: number;
    take: number;
  } & WalletFilters,
) => {
  return prisma.walletTransaction.findMany({
    where: walletWhere(params),
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
};

export const countWalletTransactions = async (params: WalletFilters = {}) => {
  return prisma.walletTransaction.count({ where: walletWhere(params) });
};

export const getWalletTransactionsSummary = async (
  params: WalletFilters = {},
) => {
  const base = walletWhere(params);
  // `kind` filter on the page narrows which rows each total can see.
  const [charged, paidOut, collected] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: { ...base, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { ...base, amount: { lt: 0 }, kind: { not: "COLLECTION" } },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { ...base, kind: "COLLECTION" },
      _sum: { amount: true },
    }),
  ]);
  return {
    // Charges to captains (adjustments up, cancellation penalties).
    totalCharged: Number(charged._sum.amount ?? 0),
    // Manual credits paid out to captains (negative adjustments).
    totalPaidOut: Math.abs(Number(paidOut._sum.amount ?? 0)),
    // Dues actually collected from captains (resets / approved payments).
    totalCollected: Math.abs(Number(collected._sum.amount ?? 0)),
  };
};
