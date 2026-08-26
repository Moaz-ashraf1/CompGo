import {
  InvalidRefreshTokenError,
  RefreshTokenExpiredError,
  SessionCompromisedError,
} from "../../exceptions/auth.exceptions.js";
import { generateAccessToken, type AccountRole } from "../../utils/jwt.js";
import { generateRefreshToken, hashRefreshToken } from "../../utils/token.js";
import * as tokenRepo from "./auth.repository.js";

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;
const buildRefreshTokenExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);
  return expiresAt;
};

export const issueTokenPair = async (params: {
  userId: string;
  role: AccountRole;
  deviceId: string;
  ipAddress: string;
  familyId?: string;
}) => {
  const familyId = params.familyId ?? crypto.randomUUID();

  const accessToken = generateAccessToken({
    sub: params.userId,
    role: params.role,
    familyId,
  });

  const rawRefreshToken = generateRefreshToken();

  await tokenRepo.createRefreshToken({
    userId: params.userId,
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
  const existing = await tokenRepo.findRefreshTokenByHash(tokenHash);

  if (!existing) {
    throw new InvalidRefreshTokenError();
  }

  if (existing.revoked) {
    await tokenRepo.revokeFamily(existing.familyId);
    throw new SessionCompromisedError();
  }

  if (existing.expiresAt < new Date()) {
    throw new RefreshTokenExpiredError();
  }
  await tokenRepo.revokeRefreshToken(existing.id);

  return issueTokenPair({
    userId: existing.userId,
    role: existing.role,
    deviceId: params.deviceId,
    ipAddress: params.ipAddress,
    familyId: existing.familyId,
  });
};
