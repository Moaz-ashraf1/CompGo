import {
  InvalidCredentialsError,
  PhoneAlreadyInUseError,
  ClientNotFoundError,
} from "../../exceptions/client.exceptions.js";
import * as clientRepo from "./client.repo.js";
import * as authRepo from "../auth/auth.repository.js";
import * as tripService from "../trip/trip.service.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import { ClientStatus } from "../../generated/prisma/client.js";
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

export const blockClient = async (id: string) => {
  const client = await clientRepo.findClientById(id);
  if (!client) throw new ClientNotFoundError();

  if (client.status === ClientStatus.BLOCKED) return client;
  return clientRepo.updateClientStatus(id, ClientStatus.BLOCKED);
};

export const unblockClient = async (id: string) => {
  const client = await clientRepo.findClientById(id);
  if (!client) throw new ClientNotFoundError();

  if (client.status === ClientStatus.ACTIVE) return client;
  return clientRepo.updateClientStatus(id, ClientStatus.ACTIVE);
};

/// Composes the dashboard's client detail page: the safe profile plus
/// recent trip history (with captain info attached, since an admin can
/// see everything) - no wallet/rating section here, since only captains
/// carry a balance and only clients rate trips (not the other way
/// around).
export const getClientDetail = async (id: string) => {
  const client = await clientRepo.findClientById(id);
  if (!client) throw new ClientNotFoundError();

  const trips = await tripService.getClientTrips(id);

  return {
    client,
    recentTrips: trips.slice(0, 20),
  };
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
