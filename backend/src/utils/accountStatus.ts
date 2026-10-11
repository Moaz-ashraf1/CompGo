import { prisma } from "../config/prisma.js";
import type { AccountRole } from "./jwt.js";

/// A blocked captain/client must be locked out immediately, not whenever
/// their current token happens to expire - so every authenticated request,
/// token refresh and socket connection asks this instead of trusting the
/// token alone.
export const isAccountBlocked = async (role: AccountRole, id: string) => {
  if (role === "CAPTAIN") {
    const captain = await prisma.captain.findUnique({
      where: { id },
      select: { status: true },
    });
    return captain?.status === "BLOCKED";
  }
  if (role === "CLIENT") {
    const client = await prisma.client.findUnique({
      where: { id },
      select: { status: true },
    });
    return client?.status === "BLOCKED";
  }
  return false;
};

export const ACCOUNT_BLOCKED_MESSAGE = "تم إيقاف حسابك، تواصل مع الدعم";
