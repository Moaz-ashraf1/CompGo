import * as repo from "./offers.repository.js";
import * as clientRepo from "../client/client.repo.js";
import { notifyAccount } from "../notification/notification.service.js";
import { ClientNotFoundForGrantError } from "../../exceptions/offers.exceptions.js";
import type {
  CreditTransactionKind,
} from "../../generated/prisma/client.js";
import type { GrantCreditDTO, OfferSettingsDTO } from "./offers.validation.js";

const round2 = (n: number) => Math.round(n * 100) / 100;

export const getMyCredit = async (clientId: string, page: number) => {
  const [credit, history] = await Promise.all([
    repo.findClientCredit(clientId),
    repo.findCreditTransactionsForClient(clientId, page),
  ]);
  return {
    balance: Number(credit?.creditBalance ?? 0),
    transactions: history.transactions,
    total: history.total,
    page,
    pageSize: history.pageSize,
  };
};

export const addCredit = (
  clientId: string,
  amount: number,
  kind: CreditTransactionKind,
  reason: string,
  tripId?: string,
) => repo.addCredit(clientId, round2(amount), kind, reason, tripId);

const notifyCredit = (clientId: string, amount: number, reason: string) =>
  void notifyAccount(clientId, "CLIENT", {
    title: "وصلك رصيد جديد",
    body: `${amount} ج.م - ${reason}`,
    data: { type: "credit:added" },
  });

/// Admin hands out credit to one client (by phone) or to every active one.
export const grant = async (data: GrantCreditDTO) => {
  if (data.allClients) {
    const count = await repo.grantCreditToAllActive(data.amount, data.reason);
    const clients = await repo.findActiveClientIds();
    clients.forEach((c) => notifyCredit(c.id, data.amount, data.reason));
    return { recipients: count };
  }
  const client = await clientRepo.findClientByPhone(data.phone!);
  if (!client) throw new ClientNotFoundForGrantError();
  await repo.addCredit(client.id, data.amount, "GRANT", data.reason);
  notifyCredit(client.id, data.amount, data.reason);
  return { recipients: 1 };
};

export const welcomeBonusFor = async (clientId: string) => {
  const settings = await repo.findOfferSettings();
  const amount = Number(settings?.welcomeBonusAmount ?? 0);
  if (amount > 0) {
    await repo.addCredit(clientId, amount, "WELCOME", "هدية الترحيب بالتسجيل");
  }
};

export const getSettings = async () => {
  const s = await repo.findOfferSettings();
  return {
    cashbackPercent: s?.cashbackPercent === null || s === null ? null : Number(s?.cashbackPercent),
    welcomeBonusAmount:
      s?.welcomeBonusAmount === null || s === null ? null : Number(s?.welcomeBonusAmount),
    creditMaxUsagePercent: s?.creditMaxUsagePercent ?? 100,
  };
};

export const updateSettings = async (data: OfferSettingsDTO) => {
  await repo.upsertOfferSettings(data);
  return getSettings();
};

export const getAllTransactions = async (params: {
  page: number;
  clientId?: string;
  kind?: CreditTransactionKind;
  from?: Date;
  to?: Date;
}) => {
  const result = await repo.findAllCreditTransactions(params);
  const clientIds = [...new Set(result.transactions.map((t) => t.clientId))];
  const clients = await clientRepo.findClientsPublicByIds(clientIds);
  const byId = new Map(clients.map((c) => [c.id, c]));
  return {
    ...result,
    page: params.page,
    transactions: result.transactions.map((t) => ({
      ...t,
      client: byId.get(t.clientId) ?? null,
    })),
  };
};
