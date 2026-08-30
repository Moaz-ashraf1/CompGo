import * as captainRepo from "./captain.repository.js";
import * as captainExceptions from "../../exceptions/captain.exceptions.js";
import type { RegisterCaptainDTO } from "./captain.validation.js";
import { CaptainStatus } from "../../generated/prisma/client.js";

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
