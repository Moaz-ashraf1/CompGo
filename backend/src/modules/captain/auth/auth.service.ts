import type {
  LoginCaptainDTO,
  RegisterCaptainDTO,
} from "./../captain.validation.js";
import * as authRepo from "./auth.repository.js";
import * as authService from "../../auth/auth.service.js";
import { comparePassword, hashPassword } from "../../../utils/hash.js";
import {
  CaptainAlreadyExistsError,
  CaptainPendingApprovalError,
  InvalidCredentialsError,
  VehicleNumberAlreadyInUseError,
} from "../../../exceptions/captain.exceptions.js";

export const registerCaptain = async (data: RegisterCaptainDTO) => {
  const existingCaptain = await authRepo.findCaptainByPhone(data.phone);

  if (existingCaptain) {
    throw new CaptainAlreadyExistsError();
  }

  const existingVehicle = await authRepo.findCaptainByVehicleNumber(
    data.vehicleNumber,
  );

  if (existingVehicle) {
    throw new VehicleNumberAlreadyInUseError();
  }
  const passwordHash = await hashPassword(data.password);

  const captain = await authRepo.createCaptain({
    name: data.name,
    phone: data.phone,
    gender: data.gender,
    passwordHash,
    profilePhoto: data.profilePhoto,
    nationalIdImage: data.nationalIdImage,
    licenseImage: data.licenseImage,
    vehicleNumber: data.vehicleNumber,
    vehicleType: data.vehicleType,
    vehicleModel: data.vehicleModel,
  });

  return {
    name: data.name,
    phone: data.phone,
    gender: data.gender,
    profilePhoto: data.profilePhoto,
    nationalIdImage: data.nationalIdImage,
    licenseImage: data.licenseImage,
    vehicleNumber: data.vehicleNumber,
    vehicleType: data.vehicleType,
    vehicleModel: data.vehicleModel,
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

  if (!isPasswordValid) throw new InvalidCredentialsError();
  // Only reveal the pending-approval state once the password has already
  // matched - same reasoning as BLOCKED below, this stays behind proof of
  // ownership of the account instead of leaking status from just a phone
  // number guess.
  if (captain.status === "PENDING") throw new CaptainPendingApprovalError();
  if (captain.status === "BLOCKED") throw new InvalidCredentialsError();

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
