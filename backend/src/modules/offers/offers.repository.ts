import { prisma } from "../../config/prisma.js";
import type {
  CreditTransactionKind,
  Prisma,
} from "../../generated/prisma/client.js";

const CREDIT_PAGE_SIZE = 20;

// ----- credit -----

export const findClientCredit = (clientId: string) =>
  prisma.client.findUnique({
    where: { id: clientId },
    select: { creditBalance: true },
  });

export const addCredit = (
  clientId: string,
  amount: number,
  kind: CreditTransactionKind,
  reason: string,
  tripId?: string,
) =>
  prisma.$transaction([
    prisma.client.update({
      where: { id: clientId },
      data: { creditBalance: { increment: amount } },
    }),
    prisma.clientCreditTransaction.create({
      data: { clientId, amount, kind, reason, tripId: tripId ?? null },
    }),
  ]);

/// Takes `amount` off the balance only if it's all there - the guard that
/// stops two requests spending the same credit.
export const tryReserveCredit = async (clientId: string, amount: number) => {
  const result = await prisma.client.updateMany({
    where: { id: clientId, creditBalance: { gte: amount } },
    data: { creditBalance: { decrement: amount } },
  });
  return result.count > 0;
};

export const restoreCredit = (clientId: string, amount: number) =>
  prisma.client.update({
    where: { id: clientId },
    data: { creditBalance: { increment: amount } },
  });

export const recordCreditTransaction = (data: {
  clientId: string;
  amount: number;
  kind: CreditTransactionKind;
  reason: string;
  tripId?: string;
}) =>
  prisma.clientCreditTransaction.create({
    data: { ...data, tripId: data.tripId ?? null },
  });

export const findCreditTransactionsForClient = async (
  clientId: string,
  page: number,
) => {
  const where = { clientId };
  const [transactions, total] = await Promise.all([
    prisma.clientCreditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * CREDIT_PAGE_SIZE,
      take: CREDIT_PAGE_SIZE,
    }),
    prisma.clientCreditTransaction.count({ where }),
  ]);
  return { transactions, total, pageSize: CREDIT_PAGE_SIZE };
};

export const findAllCreditTransactions = async (params: {
  page: number;
  clientId?: string;
  kind?: CreditTransactionKind;
  from?: Date;
  to?: Date;
}) => {
  const where: Prisma.ClientCreditTransactionWhereInput = {
    ...(params.clientId ? { clientId: params.clientId } : {}),
    ...(params.kind ? { kind: params.kind } : {}),
    ...(params.from || params.to
      ? {
          createdAt: {
            ...(params.from ? { gte: params.from } : {}),
            ...(params.to ? { lte: params.to } : {}),
          },
        }
      : {}),
  };
  const [transactions, total, granted, spent] = await Promise.all([
    prisma.clientCreditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * CREDIT_PAGE_SIZE,
      take: CREDIT_PAGE_SIZE,
    }),
    prisma.clientCreditTransaction.count({ where }),
    prisma.clientCreditTransaction.aggregate({
      where: { ...where, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.clientCreditTransaction.aggregate({
      where: { ...where, amount: { lt: 0 } },
      _sum: { amount: true },
    }),
  ]);
  return {
    transactions,
    total,
    pageSize: CREDIT_PAGE_SIZE,
    summary: {
      totalGranted: Number(granted._sum.amount ?? 0),
      totalSpent: Math.abs(Number(spent._sum.amount ?? 0)),
    },
  };
};

export const findActiveClientIds = () =>
  prisma.client.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

export const grantCreditToAllActive = async (
  amount: number,
  reason: string,
) => {
  const clients = await findActiveClientIds();
  if (clients.length === 0) return 0;
  await prisma.$transaction([
    prisma.client.updateMany({
      where: { status: "ACTIVE" },
      data: { creditBalance: { increment: amount } },
    }),
    prisma.clientCreditTransaction.createMany({
      data: clients.map((c) => ({
        clientId: c.id,
        amount,
        kind: "GRANT" as const,
        reason,
      })),
    }),
  ]);
  return clients.length;
};

// ----- promo codes -----

export const findAllPromoCodes = () =>
  prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

export const findPromoCodeById = (id: string) =>
  prisma.promoCode.findUnique({ where: { id } });

export const findPromoCodeByCode = (code: string) =>
  prisma.promoCode.findUnique({ where: { code } });

export const createPromoCode = (data: Prisma.PromoCodeUncheckedCreateInput) =>
  prisma.promoCode.create({ data });

export const updatePromoCode = (
  id: string,
  data: Prisma.PromoCodeUncheckedUpdateInput,
) => prisma.promoCode.update({ where: { id }, data });

export const deletePromoCode = (id: string) =>
  prisma.promoCode.delete({ where: { id } });

export const countClientRedemptions = (promoCodeId: string, clientId: string) =>
  prisma.promoRedemption.count({ where: { promoCodeId, clientId } });

/// Counts one use of the code unless it just ran out - stops a code with
/// `maxUses` being redeemed past its limit by simultaneous requests.
export const tryReservePromoUse = async (promoCodeId: string) => {
  const affected = await prisma.$executeRaw`
    UPDATE "PromoCode" SET "usedCount" = "usedCount" + 1
    WHERE "id" = ${promoCodeId}
      AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`;
  return affected > 0;
};

export const releasePromoUse = (promoCodeId: string) =>
  prisma.promoCode.update({
    where: { id: promoCodeId },
    data: { usedCount: { decrement: 1 } },
  });

export const createPromoRedemption = (data: {
  promoCodeId: string;
  clientId: string;
  tripId: string;
  discount: number;
}) => prisma.promoRedemption.create({ data });

export const findPromoRedemptionByTrip = (tripId: string) =>
  prisma.promoRedemption.findFirst({ where: { tripId } });

export const deletePromoRedemption = (id: string) =>
  prisma.promoRedemption.delete({ where: { id } });

// ----- settings -----

export const findOfferSettings = () =>
  prisma.appSettings.findFirst({
    select: {
      id: true,
      cashbackPercent: true,
      welcomeBonusAmount: true,
      creditMaxUsagePercent: true,
    },
  });

export const upsertOfferSettings = async (data: {
  cashbackPercent: number | null;
  welcomeBonusAmount: number | null;
  creditMaxUsagePercent: number;
}) => {
  const existing = await prisma.appSettings.findFirst({
    select: { id: true },
  });
  if (existing) {
    return prisma.appSettings.update({ where: { id: existing.id }, data });
  }
  return prisma.appSettings.create({ data });
};
