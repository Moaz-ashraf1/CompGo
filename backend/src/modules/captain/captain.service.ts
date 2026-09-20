import * as captainRepo from "./captain.repository.js";
import * as authRepo from "../auth/auth.repository.js";
import * as captainExceptions from "../../exceptions/captain.exceptions.js";
import type {
  UpdateCaptainProfileDTO,
  ChangeCaptainPasswordDTO,
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

export const getAllCaptains = async () => {
  return captainRepo.findAllCaptains();
};

export const getCaptainById = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  return captain;
};

export const blockCaptain = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  if (captain.status === CaptainStatus.BLOCKED) {
    return captain;
  }

  return captainRepo.updateCaptainStatus(id, CaptainStatus.BLOCKED);
};

export const unblockCaptain = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  if (captain.status === CaptainStatus.ACTIVE) {
    return captain;
  }

  return captainRepo.updateCaptainStatus(id, CaptainStatus.ACTIVE);
};

export const resetAmountDue = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundError();
  }

  return captainRepo.resetCaptainAmountDue(id);
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
export const updateAvailability = async (
  captainId: string,
  isAvailable: boolean,
) => {
  return captainRepo.updateAvailability(captainId, isAvailable);
};
