import * as deviceTokenRepo from "./device-token.repository.js";
import type { AccountRole } from "../../generated/prisma/client.js";
import type { RegisterDeviceTokenDTO } from "./device-token.validation.js";

export const registerDeviceToken = async (
  accountId: string,
  role: AccountRole,
  data: RegisterDeviceTokenDTO,
) => {
  await deviceTokenRepo.upsertDeviceToken({
    accountId,
    role,
    token: data.token,
    platform: data.platform,
  });
};

export const removeDeviceToken = async (token: string) => {
  await deviceTokenRepo.removeDeviceToken(token);
};
