import type {
  LoginCaptainDTO,
  RegisterCaptainDTO,
} from "./../captain.validation.js";
import * as authRepo from "./auth.repository.js";
import * as authService from "../../auth/auth.service.js";
import { comparePassword, hashPassword } from "../../../utils/hash.js";
import {
  CaptainAlreadyExistsError,
  InvalidCredentialsError,
} from "../../../exceptions/captain.exceptions.js";

export const registerCaptain = async (data: RegisterCaptainDTO) => {
  const existingCaptain = await authRepo.findCaptainByPhone(data.phone);

  if (existingCaptain) {
    throw new CaptainAlreadyExistsError();
  }

  const passwordHash = await hashPassword(data.password);

  const captain = await authRepo.createCaptain({
    name: data.name,
    phone: data.phone,
    gender: data.gender,
    passwordHash,
    nationalIdImage: data.nationalIdImage,
    licenseImage: data.licenseImage,
    vehicleNumber: data.vehicleNumber,
    vehicleType: data.vehicleType,
    vehicleModel: data.vehicleModel,
  });

  return {
    id: captain.id,
    name: captain.name,
    phone: captain.phone,
    gender: captain.gender,
    accountType: "CAPTAIN",
  };
};

export const loginCaptain = async (
  data: LoginCaptainDTO,
  meta: { deviceId: string; ipAddress: string },
) => {
  const captain = await authRepo.findCaptainByPhone(data.phone);
  if (!captain) throw new InvalidCredentialsError();

  const isPasswordValid = await comparePassword(
    data.password,
    captain.passwordHash,
  );

  if (!isPasswordValid || captain.status === "BLOCKED")
    throw new InvalidCredentialsError();

  const { accessToken, refreshToken } = await authService.issueTokenPair({
    accountId: captain.id,
    role: "CAPTAIN",
    deviceId: meta.deviceId,
    ipAddress: meta.ipAddress,
  });

  return {
    captainId: captain.id,
    accessToken,
    refreshToken,
  };
};
