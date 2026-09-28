import * as settlementRepo from "./settlement.repository.js";
import * as captainRepo from "../captain/captain.repository.js";
import * as captainService from "../captain/captain.service.js";
import { notifyAccount } from "../notification/notification.service.js";
import { SettlementStatus } from "../../generated/prisma/client.js";
import { CaptainNotFoundError } from "../../exceptions/captain.exceptions.js";
import {
  SettlementAlreadyPendingError,
  NoAmountDueError,
  SettlementNotFoundError,
  SettlementNotPendingError,
} from "../../exceptions/settlement.exceptions.js";
import type { CreateSettlementSubmissionDTO } from "./settlement.validation.js";

const attachCaptainInfo = async <T extends { captainId: string }>(
  submissions: T[],
) => {
  const ids = [...new Set(submissions.map((s) => s.captainId))];
  const captains = await captainRepo.findCaptainsPublicByIds(ids);
  const byId = new Map(captains.map((c) => [c.id, c]));
  return submissions.map((s) => ({
    ...s,
    captain: byId.get(s.captainId) ?? null,
  }));
};

export const submitSettlement = async (
  captainId: string,
  data: CreateSettlementSubmissionDTO,
) => {
  const captain = await captainRepo.findCaptainById(captainId);
  if (!captain) throw new CaptainNotFoundError();

  const amountDue = Number(captain.amountDue);
  if (amountDue <= 0) throw new NoAmountDueError();

  const existingPending = await settlementRepo.findPendingSubmissionForCaptain(
    captainId,
  );
  if (existingPending) throw new SettlementAlreadyPendingError();

  return settlementRepo.createSubmission(captainId, amountDue, data);
};

export const getMyPendingSubmission = async (captainId: string) => {
  return settlementRepo.findPendingSubmissionForCaptain(captainId);
};

export const getAllSubmissions = async (params: {
  status?: SettlementStatus;
}) => {
  const submissions = await settlementRepo.findAllSubmissions(params);
  return attachCaptainInfo(submissions);
};

export const approveSubmission = async (id: string) => {
  const submission = await settlementRepo.findSubmissionById(id);
  if (!submission) throw new SettlementNotFoundError();
  if (submission.status !== SettlementStatus.PENDING) {
    throw new SettlementNotPendingError();
  }

  const [updated] = await Promise.all([
    settlementRepo.markSubmissionApproved(id),
    captainService.resetAmountDue(submission.captainId),
  ]);

  void notifyAccount(submission.captainId, "CAPTAIN", {
    title: "تم تأكيد دفعتك",
    body: `تم تأكيد استلام ${Number(submission.amount).toFixed(2)} ج.م وتصفير المستحقات`,
    data: { type: "settlement:approved" },
  });

  return updated;
};

export const rejectSubmission = async (id: string, reason?: string) => {
  const submission = await settlementRepo.findSubmissionById(id);
  if (!submission) throw new SettlementNotFoundError();
  if (submission.status !== SettlementStatus.PENDING) {
    throw new SettlementNotPendingError();
  }

  const updated = await settlementRepo.markSubmissionRejected(id, reason);

  void notifyAccount(submission.captainId, "CAPTAIN", {
    title: "تم رفض إثبات الدفع",
    body: reason ? `السبب: ${reason}` : "راجع تفاصيل الدفع وحاول تاني",
    data: { type: "settlement:rejected" },
  });

  return updated;
};
