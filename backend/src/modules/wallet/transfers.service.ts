import { StatusCodes } from "http-status-codes";
import { prisma } from "../../config/prisma.js";
import { AppException } from "../../exceptions/AppException.js";
import { notifyAccount } from "../notification/notification.service.js";
import type { RecordCaptainTransferDTO } from "../admin/admin.validation.js";

export const METHOD_LABELS: Record<string, string> = {
  INSTAPAY: "إنستاباي",
  VODAFONE_CASH: "فودافون كاش",
  CASH: "كاش",
  OTHER: "أخرى",
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/// The captain paid the company part (or all) of what they owe: lowers
/// amountDue, and when it reaches zero that is the settlement event (same as
/// "تصفير المستحقات" - restarts the collection cycle).
export const recordTransfer = async (
  captainId: string,
  data: RecordCaptainTransferDTO,
) => {
  const amount = round2(data.amount);
  const reason = `تحويل · ${METHOD_LABELS[data.method]}${data.note ? ` · ${data.note}` : ""}`;

  const result = await prisma.$transaction(async (tx) => {
    const captain = await tx.captain.findUnique({
      where: { id: captainId },
      select: { amountDue: true },
    });
    if (!captain) {
      throw new AppException("Captain not found", StatusCodes.NOT_FOUND);
    }
    const due = Number(captain.amountDue);
    if (amount > due) {
      throw new AppException(
        "المبلغ أكبر من المستحق على الكابتن",
        StatusCodes.BAD_REQUEST,
      );
    }
    const settled = round2(due - amount) === 0;
    await tx.walletTransaction.create({
      data: {
        captainId,
        amount: -amount,
        reason,
        kind: "COLLECTION",
        method: data.method,
        note: data.note ?? null,
      },
    });
    const updated = await tx.captain.update({
      where: { id: captainId },
      data: {
        amountDue: { decrement: amount },
        ...(settled ? { lastSettledAt: new Date() } : {}),
      },
      select: { amountDue: true },
    });
    return { remaining: Number(updated.amountDue), settled };
  });

  void notifyAccount(captainId, "CAPTAIN", {
    title: "تم تسجيل تحويلك",
    body: `تم تسجيل تحويل ${amount.toFixed(2)} ج.م (${METHOD_LABELS[data.method]}) وخصمه من المستحق`,
    data: { type: "wallet:adjustment" },
  });

  return result;
};

/// Undoes a recorded transfer: the amount goes back onto what the captain
/// owes, and a reversing row keeps the ledger honest.
export const cancelTransfer = async (captainId: string, transactionId: string) => {
  await prisma.$transaction(async (tx) => {
    const original = await tx.walletTransaction.findUnique({
      where: { id: transactionId },
    });
    if (
      !original ||
      original.captainId !== captainId ||
      original.kind !== "COLLECTION" ||
      original.reversalOfId !== null
    ) {
      throw new AppException("Transfer not found", StatusCodes.NOT_FOUND);
    }
    if (original.cancelledAt) {
      throw new AppException("التحويل ده اتلغى قبل كده", StatusCodes.CONFLICT);
    }
    const amount = Math.abs(Number(original.amount));
    await tx.walletTransaction.update({
      where: { id: original.id },
      data: { cancelledAt: new Date() },
    });
    await tx.walletTransaction.create({
      data: {
        captainId,
        amount,
        reason: "إلغاء تحويل",
        kind: "COLLECTION",
        reversalOfId: original.id,
      },
    });
    await tx.captain.update({
      where: { id: captainId },
      data: { amountDue: { increment: amount } },
    });
  });
};
