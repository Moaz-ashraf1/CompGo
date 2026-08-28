import type { LoginClientDTO, RegisterClientDTO } from "./auth.validation.js";
import * as authRepo from "./auth.repository.js";
import * as authService from "../../auth/auth.service.js";
import { comparePassword, hashPassword } from "../../../utils/hash.js";
import { ClientAlreadyExistsError } from "../../../exceptions/auth.exceptions.js";
import { InvalidCredentialsError } from "../../../exceptions/client.exceptions.js";

export const registerClient = async (data: RegisterClientDTO) => {
  const existingClient = await authRepo.findClientByPhone(data.phone);

  if (existingClient) {
    throw new ClientAlreadyExistsError();
  }

  const passwordHash = await hashPassword(data.password);

  const client = await authRepo.createClient({
    name: data.name,
    phone: data.phone,
    gender: data.gender,
    passwordHash,
  });

  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    gender: client.gender,
    accountType: "CLIENT",
  };
};

export const loginClient = async (
  data: LoginClientDTO,
  meta: { deviceId: string; ipAddress: string },
) => {
  const client = await authRepo.findClientByPhone(data.phone);
  if (!client) throw new InvalidCredentialsError();

  const isPasswordValid = await comparePassword(
    data.password,
    client.passwordHash,
  );

  if (!isPasswordValid || client.status === "BLOCKED")
    throw new InvalidCredentialsError();

  const { accessToken, refreshToken } = await authService.issueTokenPair({
    accountId: client.id,
    role: "CLIENT",
    deviceId: meta.deviceId,
    ipAddress: meta.ipAddress,
  });

  return {
    clientId: client.id,
    accessToken,
    refreshToken,
  };
};
