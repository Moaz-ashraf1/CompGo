import * as captainRepo from "./captain.repository.js";
import * as captainExceptions from "../../exceptions/captain.exceptions.js";
import type { CreateCaptainDto } from "./captain.validation.js";
import { CaptainStatus } from "../../generated/prisma/client.js";

export const registerCaptain = async (data: CreateCaptainDto) => {
  const existingCaptainByPhone = await captainRepo.findCaptainByPhone(data.phone);

  if (existingCaptainByPhone) {
    throw new captainExceptions.CaptainAlreadyExistsException(
      "Captain with this phone number already exists"
    );
  }

  const existingCaptainByVehicle =
    await captainRepo.findCaptainByVehicleNumber(data.vehicleNumber);

  if (existingCaptainByVehicle) {
    throw new captainExceptions.CaptainAlreadyExistsException(
      "Captain with this vehicle number already exists"
    );
  }

  return captainRepo.createCaptain(data);
};

export const getAllCaptains = async () => {
  return captainRepo.findAllCaptains();
};

export const getCaptainById = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundException();
  }

  return captain;
};

export const blockCaptain = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundException();
  }

  if (captain.status === CaptainStatus.BLOCKED) {
    return captain;
  }

  return captainRepo.updateCaptainStatus(id, CaptainStatus.BLOCKED);
};

export const unblockCaptain = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundException();
  }

  if (captain.status === CaptainStatus.ACTIVE) {
    return captain;
  }

  return captainRepo.updateCaptainStatus(id, CaptainStatus.ACTIVE);
};

export const resetAmountDue = async (id: string) => {
  const captain = await captainRepo.findCaptainById(id);

  if (!captain) {
    throw new captainExceptions.CaptainNotFoundException();
  }

  return captainRepo.resetCaptainAmountDue(id);
};