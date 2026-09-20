import {
  InvalidCredentialsError,
  PhoneAlreadyInUseError,
} from "../../exceptions/client.exceptions.js";
import * as clientRepo from "./client.repo.js";
import * as authRepo from "../auth/auth.repository.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import type {
  UpdateClientProfileDTO,
  ChangeClientPasswordDTO,
} from "./client.validation.js";

export const getMe = async (clientId: string) => {
  const client = await clientRepo.findClientById(clientId);
  if (!client) {
    throw new InvalidCredentialsError();
  }

  // `findClientById` already uses `clientSafeSelect` (no passwordHash), so
  // return it as-is instead of re-picking a couple of fields - that was
  // silently dropping `status`/`tripNum` from every GET /me response.
  return client;
};

export const updateMe = async (
  clientId: string,
  data: UpdateClientProfileDTO,
) => {
  if (data.phone) {
    const existingClient = await clientRepo.findClientByPhone(data.phone);
    if (existingClient && existingClient.id !== clientId) {
      throw new PhoneAlreadyInUseError();
    }
  }

  return clientRepo.updateClient(clientId, data);
};
export const getAllClientsForAdmin = async () => {
  return clientRepo.findAllClients();
};

export const changePassword = async (
  clientId: string,
  data: ChangeClientPasswordDTO,
) => {
  const client = await clientRepo.findClientAuthById(clientId);
  if (!client) {
    throw new InvalidCredentialsError();
  }

  const isCurrentValid = await comparePassword(
    data.currentPassword,
    client.passwordHash,
  );
  if (!isCurrentValid) {
    throw new InvalidCredentialsError("Current password is incorrect");
  }

  const passwordHash = await hashPassword(data.newPassword);
  await clientRepo.updateClientPassword(clientId, passwordHash);

  // Force re-login everywhere else, same as an admin-triggered reset.
  await authRepo.revokeAllByAccount(clientId);
};
