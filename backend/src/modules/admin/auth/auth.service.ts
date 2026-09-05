import type { LoginAdminDTO } from "./auth.validation.js";
import * as authRepo from "./auth.repository.js";
import * as authService from "../../auth/auth.service.js";
import { comparePassword } from "../../../utils/hash.js";
import { InvalidCredentialsError } from "../../../exceptions/admin.exceptions.js";

export const loginAdmin = async (
  data: LoginAdminDTO,
  meta: { deviceId: string; ipAddress: string },
) => {
  const admin = await authRepo.findAdminByUsername(data.username);
  if (!admin) throw new InvalidCredentialsError();

  const isPasswordValid = await comparePassword(
    data.password,
    admin.passwordHash,
  );
  if (!isPasswordValid) throw new InvalidCredentialsError();

  const { accessToken, refreshToken } = await authService.issueTokenPair({
    accountId: admin.id,
    role: "ADMIN",
    deviceId: meta.deviceId,
    ipAddress: meta.ipAddress,
  });

  return {
    adminId: admin.id,
    username: admin.username,
    accessToken,
    refreshToken,
  };
};
