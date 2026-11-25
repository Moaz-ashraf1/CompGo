import * as captainRepo from "./captain.repository.js";
import * as authRepo from "../auth/auth.repository.js";
import * as captainExceptions from "../../exceptions/captain.exceptions.js";
import type {
  UpdateCaptainProfileDTO,
  ChangeCaptainPasswordDTO,
  UpdateCaptainLocationDTO,
} from "./captain.validation.js";
import { CaptainStatus } from "../../generated/prisma/client.js";
import {
  InvalidCredentialsError,
  PhoneAlreadyInUseError,
} from "../../exceptions/captain.exceptions.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import * as tripService from "../trip/trip.service.js";
import { prisma } from "../../config/prisma.js";
import { lockOutAccount } from "../auth/lockout.js";
import { emitToCaptainAdmins } from "../../realtime/socket.js";

export const getMe = async (captainId: string) => {
  const captain = await captainRepo.findCaptainById(captainId);

  if (!captain) {
    throw new InvalidCredentialsError();
  }

  // `findCaptainById` already uses `captainSafeSelect` (no passwordHash),
  // so return it as-is instead of re-picking a handful of fields - that
  // was silently dropping vehicle info and `isAvailable` from every
  // GET /me response even after the DB/repository grew those fields.
  return captain;
};

export const updateMe = async (
  captainId: string,
  data: UpdateCaptainProfileDTO,
) => {
  const existingCaptain = await captainRepo.findCaptainById(captainId);

  if (!existingCaptain) {
    throw new InvalidCredentialsError();
  }

  if (data.phone) {
    const captainWithPhone = await captainRepo.findCaptainByPhone(data.phone);
    if (captainWithPhone && captainWithPhone.id !== captainId) {
      throw new PhoneAlreadyInUseError();
    }
  }

  return captainRepo.updateCaptain(captainId, data);
};

const DAY_MS = 86400000;

/// When the captain started owing: the later of their last settlement and
/// their first completed trip since then (a captain settled a month ago is not
/// late the moment they earn their first fare). Same rule the automatic block
/// uses (see autoBlock.service.ts), so the dashboard and the block agree.
export const owingSince = async (captain: {
  id: string;
  lastSettledAt: Date | null;
  createdAt: Date;
}) => {
  const baseline = captain.lastSettledAt ?? captain.createdAt;
  const firstTrip = await prisma.trip.findFirst({
    where: {
      captainId: captain.id,
      status: "COMPLETED",
      completedAt: { gt: baseline },
    },
    orderBy: { completedAt: "asc" },
    select: { completedAt: true },
  });
  return firstTrip?.completedAt ?? baseline;
};

/// Derives the date a captain's dues should be collected by, and whether it
/// has passed - from `settlementCycleDays` (admin-set) counted from when they
/// started owing. A captain who owes nothing has no due date and is never
/// late. Returns nulls when no cycle is configured.
export const withSettlementInfo = async <
  T extends {
    id: string;
    amountDue: unknown;
    settlementCycleDays: number | null;
    lastSettledAt: Date | null;
    createdAt: Date;
  },
>(
  captain: T,
) => {
  if (captain.settlementCycleDays === null || !(Number(captain.amountDue) > 0)) {
    return { ...captain, nextSettlementDueAt: null, isSettlementOverdue: false };
  }
  const since = await owingSince(captain);
  const nextSettlementDueAt = new Date(
    since.getTime() + captain.settlementCycleDays * DAY_MS,
  );
  return {
    ...captain,
    nextSettlementDueAt,
    isSettlementOverdue: nextSettlementDueAt.getTime() <= Date.now(),
  };
};

export const getAllCaptains = async () => {
  const captains = await captainRepo.findAllCaptains();
  return Promise.all(captains.map((c) => withSettlementInfo(c)));
};

export const getPendingCaptains = async () => {
  return captainRepo.findCaptainsByStatus(CaptainStatus.PENDING);
};

export const getCaptainById = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  return await withSettlementInfo(captain);
};

export const updateSettlementCycle = async (
  id: string,
  settlementCycleDays: number | null,
  autoBlockOnOverdue = false,
) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  const updated = await captainRepo.updateSettlementCycle(
    id,
    settlementCycleDays,
    settlementCycleDays !== null && autoBlockOnOverdue,
  );
  return await withSettlementInfo(updated);
};

export const blockCaptain = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  if (captain.status === CaptainStatus.BLOCKED) {
    return await withSettlementInfo(captain);
  }

  const blocked = await captainRepo.updateCaptainStatus(
    id,
    CaptainStatus.BLOCKED,
  );
  await lockOutAccount("CAPTAIN", id);
  emitToCaptainAdmins("captain:pending-changed", {});
  return await withSettlementInfo(blocked);
};

export const unblockCaptain = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  if (captain.status === CaptainStatus.ACTIVE) {
    return await withSettlementInfo(captain);
  }

  // Approving a new (PENDING) captain also turns on the auto-block for late
  // settlement (3 days by default); unblocking an existing one leaves the
  // admin's settlement settings alone.
  const activated =
    captain.status === CaptainStatus.PENDING
      ? await captainRepo.approvePendingCaptain(id, captain.settlementCycleDays)
      : await captainRepo.updateCaptainStatus(id, CaptainStatus.ACTIVE);
  emitToCaptainAdmins("captain:pending-changed", {});
  return await withSettlementInfo(activated);
};

export const resetAmountDue = async (
  id: string,
  reason = "تحصيل المستحقات",
) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  const collected = Number(captain.amountDue);
  const updated = await captainRepo.resetCaptainAmountDue(id);
  // Collecting the dues is a real money movement - without a ledger entry
  // it just vanished from the wallet history. (amount = change in
  // amountDue, so a collection is negative.)
  if (collected > 0) {
    await captainRepo.createWalletTransaction(id, -collected, reason, "COLLECTION");
  }
  return await withSettlementInfo(updated);
};

export const changePassword = async (
  captainId: string,
  data: ChangeCaptainPasswordDTO,
) => {
  const captain = await captainRepo.findCaptainAuthById(captainId);
  if (!captain) {
    throw new InvalidCredentialsError();
  }

  const isCurrentValid = await comparePassword(
    data.currentPassword,
    captain.passwordHash,
  );
  if (!isCurrentValid) {
    throw new InvalidCredentialsError("Current password is incorrect");
  }

  const passwordHash = await hashPassword(data.newPassword);
  await captainRepo.updateCaptainPassword(captainId, passwordHash);

  // Force re-login everywhere else, same as an admin-triggered reset.
  await authRepo.revokeAllByAccount(captainId);
};

export const getWallet = async (captainId: string) => {
  return tripService.getCaptainWallet(captainId);
};

export const getRating = async (captainId: string) => {
  return tripService.getCaptainRatingStats(captainId);
};
export const updateAvailability = async (
  captainId: string,
  isAvailable: boolean,
) => {
  return captainRepo.updateAvailability(captainId, isAvailable);
};

export const updateLocation = async (
  captainId: string,
  data: UpdateCaptainLocationDTO,
) => {
  await captainRepo.updateCaptainLocation(captainId, data.lat, data.lng);
  await tripService.notifyCaptainLocationUpdate(captainId, data.lat, data.lng);
};
