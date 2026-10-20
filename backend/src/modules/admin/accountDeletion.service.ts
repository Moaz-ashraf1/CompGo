import fs from "node:fs/promises";
import path from "node:path";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../config/prisma.js";
import { logger } from "../../config/logger.js";
import { AppException } from "../../exceptions/AppException.js";
import { lockOutAccount } from "../auth/lockout.js";
import { emitToCaptainAdmins } from "../../realtime/socket.js";

export type AccountKind = "CAPTAIN" | "CLIENT";

const ACTIVE_STATUSES = ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] as const;

const notFound = () => new AppException("الحساب مش موجود", StatusCodes.NOT_FOUND);

const find = async (kind: AccountKind, id: string) => {
  if (kind === "CAPTAIN") {
    const c = await prisma.captain.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        profilePhoto: true,
        nationalIdImage: true,
        licenseImage: true,
        vehicleLicenseImage: true,
        vehiclePhoto: true,
      },
    });
    if (!c) throw notFound();
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      files: [c.profilePhoto, c.nationalIdImage, c.licenseImage, c.vehicleLicenseImage, c.vehiclePhoto],
    };
  }
  const c = await prisma.client.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true },
  });
  if (!c) throw notFound();
  return { id: c.id, name: c.name, phone: c.phone, files: [] as (string | null)[] };
};

const tripWhere = (kind: AccountKind, id: string) =>
  kind === "CAPTAIN" ? { captainId: id } : { clientId: id };

/// What would disappear - shown in the dashboard's confirmation dialog.
export const getDeletionPreview = async (kind: AccountKind, id: string) => {
  const account = await find(kind, id);
  const trips = await prisma.trip.findMany({
    where: tripWhere(kind, id),
    select: { id: true, status: true },
  });
  const tripIds = trips.map((t) => t.id);
  const [messages, notifications, walletTransactions, settlements, credit, family] =
    await Promise.all([
      prisma.message.count({
        where: { OR: [{ tripId: { in: tripIds } }, { senderId: id }] },
      }),
      prisma.notification.count({ where: { accountId: id } }),
      kind === "CAPTAIN"
        ? prisma.walletTransaction.count({ where: { captainId: id } })
        : Promise.resolve(0),
      kind === "CAPTAIN"
        ? prisma.settlementSubmission.count({ where: { captainId: id } })
        : Promise.resolve(0),
      kind === "CLIENT"
        ? prisma.clientCreditTransaction.count({ where: { clientId: id } })
        : Promise.resolve(0),
      kind === "CLIENT"
        ? prisma.familyLink.count({
            where: { OR: [{ requesterId: id }, { targetId: id }] },
          })
        : Promise.resolve(0),
    ]);

  return {
    name: account.name,
    phone: account.phone,
    trips: trips.length,
    activeTrips: trips.filter((t) =>
      (ACTIVE_STATUSES as readonly string[]).includes(t.status),
    ).length,
    messages,
    notifications,
    walletTransactions,
    settlements,
    creditTransactions: credit,
    familyLinks: family,
  };
};

const removeUploadedFile = async (publicPath: string | null | undefined) => {
  if (!publicPath || !/^\/uploads\/(captains|settlements)\/[^/]+$/.test(publicPath)) {
    return;
  }
  try {
    await fs.unlink(path.join(process.cwd(), publicPath));
  } catch {
    // Already gone - nothing to clean up.
  }
};

/// Permanently deletes the account and everything tied to it. Refuses while
/// they have a trip in progress (the other side would be stranded), and the
/// caller must retype the phone number.
export const deleteAccount = async (
  kind: AccountKind,
  id: string,
  confirmPhone: string,
  adminId: string,
) => {
  const account = await find(kind, id);
  if (confirmPhone.trim() !== account.phone) {
    throw new AppException("رقم التأكيد غير مطابق", StatusCodes.BAD_REQUEST);
  }

  const trips = await prisma.trip.findMany({
    where: tripWhere(kind, id),
    select: { id: true, status: true },
  });
  if (trips.some((t) => (ACTIVE_STATUSES as readonly string[]).includes(t.status))) {
    throw new AppException(
      "عنده رحلة شغالة دلوقتي، استنى لما تخلص أو تتلغي وبعدين امسحه",
      StatusCodes.CONFLICT,
    );
  }
  const tripIds = trips.map((t) => t.id);

  const settlementFiles =
    kind === "CAPTAIN"
      ? (
          await prisma.settlementSubmission.findMany({
            where: { captainId: id },
            select: { screenshotUrl: true },
          })
        ).map((s) => s.screenshotUrl)
      : [];

  // Kick every session first, so nothing writes new data while we delete.
  await lockOutAccount(kind, id);

  await prisma.$transaction(async (tx) => {
    // Promo codes: give back the uses these trips consumed.
    const redemptions = await tx.promoRedemption.findMany({
      where: { OR: [{ tripId: { in: tripIds } }, ...(kind === "CLIENT" ? [{ clientId: id }] : [])] },
      select: { id: true, promoCodeId: true },
    });
    const perCode = new Map<string, number>();
    for (const r of redemptions) perCode.set(r.promoCodeId, (perCode.get(r.promoCodeId) ?? 0) + 1);
    for (const [promoCodeId, n] of perCode) {
      await tx.promoCode.update({
        where: { id: promoCodeId },
        data: { usedCount: { decrement: n } },
      });
    }
    await tx.promoRedemption.deleteMany({ where: { id: { in: redemptions.map((r) => r.id) } } });

    await tx.message.deleteMany({
      where: { OR: [{ tripId: { in: tripIds } }, { senderId: id }] },
    });
    // Another client's credit history may point at a captain's trip - keep
    // their ledger, just drop the link to the deleted trip.
    await tx.clientCreditTransaction.updateMany({
      where: { tripId: { in: tripIds } },
      data: { tripId: null },
    });
    await tx.trip.deleteMany({ where: { id: { in: tripIds } } }); // places cascade

    await tx.notification.deleteMany({ where: { accountId: id } });
    await tx.deviceToken.deleteMany({ where: { accountId: id } });
    await tx.refreshToken.deleteMany({ where: { accountId: id } });

    if (kind === "CAPTAIN") {
      await tx.walletTransaction.deleteMany({ where: { captainId: id } });
      await tx.settlementSubmission.deleteMany({ where: { captainId: id } });
      await tx.captain.delete({ where: { id } });
    } else {
      await tx.clientCreditTransaction.deleteMany({ where: { clientId: id } });
      await tx.familyLink.deleteMany({
        where: { OR: [{ requesterId: id }, { targetId: id }] },
      });
      await tx.client.delete({ where: { id } });
    }
  });

  await Promise.all([...account.files, ...settlementFiles].map(removeUploadedFile));

  if (kind === "CAPTAIN") emitToCaptainAdmins("captain:pending-changed", {});

  logger.warn("Account permanently deleted by admin", {
    kind,
    accountId: id,
    phone: account.phone,
    adminId,
    trips: tripIds.length,
  });
};
