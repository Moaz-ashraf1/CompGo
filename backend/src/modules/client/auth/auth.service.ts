import type { LoginClientDTO, RegisterClientDTO } from "./auth.validation.js";
import * as authRepo from "./auth.repository.js";
import { comparePassword, hashPassword } from "../../../utils/hash.js";
import { ClientAlreadyExistsError } from "../../../exceptions/auth.exceptions.js";
import { InvalidCredentialsError } from "../../../exceptions/client.exceptions.js";

export const registerClient = async (data: RegisterClientDTO) => {
  const existingUser = await authRepo.findUserByPhone(data.phone);

  if (existingUser?.client) {
    throw new ClientAlreadyExistsError();
  }

  const passwordHash = await hashPassword(data.password);

  if (!existingUser) {
    const user = await authRepo.createUserWithClient({
      name: data.name,
      phone: data.phone,
      gender: data.gender,
      passwordHash,
    });

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      gender: user.gender,
      accountType: "CLIENT",
    };
  }

  const client = await authRepo.createClientForExistingUser(
    existingUser.id,
    passwordHash,
  );

  return {
    id: existingUser.id,
    name: existingUser.name,
    phone: existingUser.phone,
    gender: existingUser.gender,
    accountType: "CLIENT",
  };
};

export const loginClient = async (data: LoginClientDTO) => {
  const user = await authRepo.findUserByPhoneWithClient(data.phone);
  if (!user || !user.client) throw new InvalidCredentialsError();

  const isPasswordValid = await comparePassword(
    data.password,
    user.client.passwordHash,
  );

  if (!isPasswordValid || user.client.status === "BLOCKED")
    throw new InvalidCredentialsError();

  return {
    userId: user.id,
    clientId: user.client.id,
  };
};
