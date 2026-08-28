import {
  InvalidCredentialsError,
  PhoneAlreadyInUseError,
} from "../../exceptions/client.exceptions.js";
import * as clientRepo from "./client.repo.js";
import type { UpdateClientProfileDTO } from "./client.validation.js";

export const getMe = async (clientId: string) => {
  const client = await clientRepo.findClientById(clientId);
  if (!client) {
    throw new InvalidCredentialsError();
  }

  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    gender: client.gender,
  };
};

export const updateMe = async (
  clientId: string,
  data: UpdateClientProfileDTO,
) => {
  if (data.phone) {
    const existingClient = await clientRepo.findClientByPhone(data.phone);
    if (existingClient) {
      throw new PhoneAlreadyInUseError();
    }
  }

  const updated = await clientRepo.updateClient(clientId, data);
  return {
    id: updated.id,
    name: updated.name,
    phone: updated.phone,
    gender: updated.gender,
  };
};
