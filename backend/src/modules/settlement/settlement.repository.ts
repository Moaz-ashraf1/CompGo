import { prisma } from "../../config/prisma.js";
import { SettlementStatus } from "../../generated/prisma/client.js";
import type { CreateSettlementSubmissionDTO } from "./settlement.validation.js";

export const findPendingSubmissionForCaptain = async (captainId: string) => {
  return prisma.settlementSubmission.findFirst({
    where: { captainId, status: SettlementStatus.PENDING },
  });
};

export const createSubmission = async (
  captainId: string,
  amount: number,
  data: CreateSettlementSubmissionDTO,
) => {
  return prisma.settlementSubmission.create({
    data: {
      captainId,
      amount,
      paymentMethod: data.paymentMethod,
      screenshotUrl: data.screenshotUrl,
    },
  });
};

export const findSubmissionById = async (id: string) => {
  return prisma.settlementSubmission.findUnique({ where: { id } });
};

export const findAllSubmissions = async (params: { status?: SettlementStatus }) => {
  return prisma.settlementSubmission.findMany({
    where: { ...(params.status ? { status: params.status } : {}) },
    orderBy: { submittedAt: "desc" },
  });
};

export const markSubmissionApproved = async (id: string) => {
  return prisma.settlementSubmission.update({
    where: { id },
    data: { status: SettlementStatus.APPROVED, reviewedAt: new Date() },
  });
};

export const markSubmissionRejected = async (id: string, reason?: string) => {
  return prisma.settlementSubmission.update({
    where: { id },
    data: {
      status: SettlementStatus.REJECTED,
      reviewedAt: new Date(),
      rejectionReason: reason ?? null,
    },
  });
};
