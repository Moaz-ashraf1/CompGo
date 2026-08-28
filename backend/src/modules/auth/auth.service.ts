import crypto from "crypto";
import * as authRepo from "./auth.repository.js";
import { generateAccessToken, type AccountRole } from "../../utils/jwt.js";
import { generateRefreshToken, hashRefreshToken } from "../../utils/token.js";
import {
  InvalidRefreshTokenError,
  RefreshTokenExpiredError,
  SessionCompromisedError,
} from "../../exceptions/auth.exceptions.js";

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

const buildRefreshTokenExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);
  return expiresAt;
};

export const issueTokenPair = async (params: {
  accountId: string;
  role: AccountRole;
  deviceId: string;
  ipAddress: string;
  familyId?: string;
}) => {
  const familyId = params.familyId ?? crypto.randomUUID();

  const accessToken = generateAccessToken({
    sub: params.accountId,
    role: params.role,
    familyId,
  });

  const rawRefreshToken = generateRefreshToken();

  await authRepo.createRefreshToken({
    accountId: params.accountId,
    role: params.role,
    tokenHash: hashRefreshToken(rawRefreshToken),
    familyId,
    deviceId: params.deviceId,
    ipAddress: params.ipAddress,
    expiresAt: buildRefreshTokenExpiry(),
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

export const rotateRefreshToken = async (params: {
  rawRefreshToken: string;
  deviceId: string;
  ipAddress: string;
}) => {
  const tokenHash = hashRefreshToken(params.rawRefreshToken);
  const existing = await authRepo.findRefreshTokenByHash(tokenHash);

  if (!existing) throw new InvalidRefreshTokenError();

  if (existing.revoked) {
    await authRepo.revokeFamily(existing.familyId);
    throw new SessionCompromisedError();
  }

  if (existing.expiresAt < new Date()) {
    throw new RefreshTokenExpiredError();
  }

  await authRepo.revokeRefreshToken(existing.id);

  return issueTokenPair({
    accountId: existing.accountId,
    role: existing.role,
    deviceId: params.deviceId,
    ipAddress: params.ipAddress,
    familyId: existing.familyId,
  });
};

export const logout = async (familyId: string) => {
  await authRepo.revokeFamily(familyId);
};
