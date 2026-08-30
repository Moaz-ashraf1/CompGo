import * as captainRepo from "./captain.repository.js";
import * as captainExceptions from "../../exceptions/captain.exceptions.js";
import type { UpdateCaptainProfileDTO } from "./captain.validation.js";
import { CaptainStatus } from "../../generated/prisma/client.js";
import {
  InvalidCredentialsError,
  PhoneAlreadyInUseError,
} from "../../exceptions/captain.exceptions.js";

export const getMe = async (captainId: string) => {
  const captain = await captainRepo.findCaptainById(captainId);
  console.log(captain);

  if (!captain) {
    throw new InvalidCredentialsError();
  }

  return {
    id: captain.id,
    name: captain.name,
    phone: captain.phone,
    gender: captain.gender,
    status: captain.status,
    amountDue: captain.amountDue,
  };
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

  const updated = await captainRepo.updateCaptain(captainId, data);

  return {
    id: updated.id,
    name: updated.name,
    phone: updated.phone,
    gender: updated.gender,
    status: updated.status,
    amountDue: updated.amountDue,
  };
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
