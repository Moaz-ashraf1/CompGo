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

/// Derives the next date a captain's dues should be collected, and
/// whether that date has already passed - from `settlementCycleDays`
/// (admin-set) and `lastSettledAt` (set automatically whenever an admin
/// resets their amountDue - see resetAmountDue below). Falls back to
/// `createdAt` when they've never been settled yet, so a new captain's
/// first cycle starts counting from signup. Returns nulls when no cycle
/// is configured for this captain.
export const withSettlementInfo = <
  T extends {
    settlementCycleDays: number | null;
    lastSettledAt: Date | null;
    createdAt: Date;
  },
>(
  captain: T,
) => {
  if (captain.settlementCycleDays === null) {
    return { ...captain, nextSettlementDueAt: null, isSettlementOverdue: false };
  }
  const base = captain.lastSettledAt ?? captain.createdAt;
  const nextSettlementDueAt = new Date(
    base.getTime() + captain.settlementCycleDays * 86400000,
  );
  return {
    ...captain,
    nextSettlementDueAt,
    isSettlementOverdue: nextSettlementDueAt.getTime() <= Date.now(),
  };
};

export const getAllCaptains = async () => {
  const captains = await captainRepo.findAllCaptains();
  return captains.map(withSettlementInfo);
};

export const getPendingCaptains = async () => {
  return captainRepo.findCaptainsByStatus(CaptainStatus.PENDING);
};

export const getCaptainById = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  return withSettlementInfo(captain);
};

export const updateSettlementCycle = async (
  id: string,
  settlementCycleDays: number | null,
) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  const updated = await captainRepo.updateSettlementCycle(
    id,
    settlementCycleDays,
  );
  return withSettlementInfo(updated);
};

export const blockCaptain = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  if (captain.status === CaptainStatus.BLOCKED) {
    return withSettlementInfo(captain);
  }

  return withSettlementInfo(
    await captainRepo.updateCaptainStatus(id, CaptainStatus.BLOCKED),
  );
};

export const unblockCaptain = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  if (captain.status === CaptainStatus.ACTIVE) {
    return withSettlementInfo(captain);
  }

  return withSettlementInfo(
    await captainRepo.updateCaptainStatus(id, CaptainStatus.ACTIVE),
  );
};

export const resetAmountDue = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  const updated = await captainRepo.resetCaptainAmountDue(id);
  return withSettlementInfo(updated);
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
