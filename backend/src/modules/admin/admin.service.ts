import * as adminRepo from "./admin.repository.js";
import * as authRepo from "../auth/auth.repository.js";
import { hashPassword } from "../../utils/hash.js";
import {
  CaptainNotFoundError,
  PhoneAlreadyInUseError,
} from "../../exceptions/captain.exceptions.js";
import { ClientNotFoundError } from "../../exceptions/client.exceptions.js";
import type {
  UpdateCaptainPhoneDTO,
  ResetPasswordDTO,
} from "./admin.validation.js";

export const updateCaptainPhone = async (
  captainId: string,
  data: UpdateCaptainPhoneDTO,
) => {
  const captain = await adminRepo.findCaptainById(captainId);
  if (!captain) throw new CaptainNotFoundError();

  const existing = await adminRepo.findCaptainByPhone(data.phone);
  if (existing && existing.id !== captainId) {
    throw new PhoneAlreadyInUseError();
  }

  return adminRepo.updateCaptainPhone(captainId, data.phone);
};

export const resetCaptainPassword = async (
  captainId: string,
  data: ResetPasswordDTO,
) => {
  const captain = await adminRepo.findCaptainById(captainId);
  if (!captain) throw new CaptainNotFoundError();

  const passwordHash = await hashPassword(data.password);
  const updated = await adminRepo.updateCaptainPassword(
    captainId,
    passwordHash,
  );

  await authRepo.revokeAllByAccount(captainId);

  return updated;
};

export const resetClientPassword = async (
  clientId: string,
  data: ResetPasswordDTO,
) => {
  const client = await adminRepo.findClientById(clientId);
  if (!client) throw new ClientNotFoundError();

  const passwordHash = await hashPassword(data.password);
  const updated = await adminRepo.updateClientPassword(clientId, passwordHash);

  await authRepo.revokeAllByAccount(clientId);

  return updated;
};
