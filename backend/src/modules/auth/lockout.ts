import * as authRepo from "./auth.repository.js";
import * as deviceTokenRepo from "../device-token/device-token.repository.js";
import { kickAccount } from "../../realtime/socket.js";

/// Everything that has to happen the moment an account is blocked so it
/// stops working right away: its refresh tokens die (no silent re-login),
/// its push tokens are dropped (no more notifications), and any open app
/// is told to log out. Requests that still carry an unexpired access token
/// are stopped by `authenticate` (see utils/accountStatus.ts).
export const lockOutAccount = async (
  role: "CAPTAIN" | "CLIENT",
  accountId: string,
) => {
  await Promise.all([
    authRepo.revokeAllByAccount(accountId),
    deviceTokenRepo.removeAllByAccountId(accountId),
  ]);
  kickAccount(role, accountId);
};
