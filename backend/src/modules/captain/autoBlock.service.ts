import { prisma } from "../../config/prisma.js";
import { logger } from "../../config/logger.js";
import { notifyAccount } from "../notification/notification.service.js";
import * as captainService from "./captain.service.js";

const DAY_MS = 86400000;

/// Blocks every captain who opted in (autoBlockOnOverdue) and still owes
/// money after the days the admin gave them (settlementCycleDays).
///
/// The deadline counts from when the captain started owing, not from an old
/// settlement: the later of their last settlement and their first trip since
/// then - otherwise someone settled a month ago would be blocked the moment
/// they earn their first fare. Captains who owe nothing are never blocked, and
/// one the admin already unblocked for this same overdue period is left alone
/// (autoBlockedAt >= deadline) until they settle and a new cycle begins.
export const blockOverdueCaptains = async (now = new Date()) => {
  const candidates = await prisma.captain.findMany({
    where: {
      status: "ACTIVE",
      autoBlockOnOverdue: true,
      settlementCycleDays: { not: null },
      amountDue: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      settlementCycleDays: true,
      lastSettledAt: true,
      createdAt: true,
      autoBlockedAt: true,
    },
  });

  let blocked = 0;
  for (const c of candidates) {
    const baseline = c.lastSettledAt ?? c.createdAt;
    const firstTrip = await prisma.trip.findFirst({
      where: { captainId: c.id, status: "COMPLETED", completedAt: { gt: baseline } },
      orderBy: { completedAt: "asc" },
      select: { completedAt: true },
    });
    const owingSince = firstTrip?.completedAt ?? baseline;
    const deadline = new Date(owingSince.getTime() + c.settlementCycleDays! * DAY_MS);
    if (deadline.getTime() > now.getTime()) continue;
    if (c.autoBlockedAt && c.autoBlockedAt.getTime() >= deadline.getTime()) continue;

    await captainService.blockCaptain(c.id);
    await prisma.captain.update({
      where: { id: c.id },
      data: { autoBlockedAt: now },
    });
    blocked += 1;
    logger.info("Captain auto-blocked for overdue settlement", {
      captainId: c.id,
      deadline: deadline.toISOString(),
    });
    // Device tokens are wiped by the block, so this lands in their
    // notification list for when they are unblocked.
    void notifyAccount(c.id, "CAPTAIN", {
      title: "تم إيقاف حسابك",
      body: "اتأخرت في تحويل المستحقات للشركة، تواصل مع الدعم عشان يتفعّل حسابك",
      data: { type: "account:auto_blocked" },
    });
  }
  return blocked;
};
