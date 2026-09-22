import * as adminRepo from "./admin.repository.js";
import * as authRepo from "../auth/auth.repository.js";
import * as captainRepo from "../captain/captain.repository.js";
import * as tripRepo from "../trip/trip.repository.js";
import * as tripService from "../trip/trip.service.js";
import { hashPassword } from "../../utils/hash.js";
import {
  CaptainNotFoundError,
  PhoneAlreadyInUseError,
} from "../../exceptions/captain.exceptions.js";
import { ClientNotFoundError } from "../../exceptions/client.exceptions.js";
import type { TripStatus, TripType } from "../../generated/prisma/client.js";
import type {
  UpdateCaptainPhoneDTO,
  ResetPasswordDTO,
  AdjustCaptainBalanceDTO,
} from "./admin.validation.js";

export const updateCaptainPhone = async (
  captainId: string,
  data: UpdateCaptainPhoneDTO,
) => {
  const captain = await adminRepo.findCaptainById(captainId);
  if (!captain) throw new CaptainNotFoundError();

  const existing = await adminRepo.findCaptainByPhone(data.phone);
  if (existing && existing.id !== captainId) {
    throw new PhoneAlreadyInUseError();
  }

  return adminRepo.updateCaptainPhone(captainId, data.phone);
};

export const resetCaptainPassword = async (
  captainId: string,
  data: ResetPasswordDTO,
) => {
  const captain = await adminRepo.findCaptainById(captainId);
  if (!captain) throw new CaptainNotFoundError();

  const passwordHash = await hashPassword(data.password);
  const updated = await adminRepo.updateCaptainPassword(
    captainId,
    passwordHash,
  );

  await authRepo.revokeAllByAccount(captainId);

  return updated;
};

export const resetClientPassword = async (
  phone: string,
  data: ResetPasswordDTO,
) => {
  const client = await adminRepo.findClientByPhone(phone);
  if (!client) throw new ClientNotFoundError();

  const passwordHash = await hashPassword(data.password);
  const updated = await adminRepo.updateClientPassword(client.id, passwordHash);

  await authRepo.revokeAllByAccount(client.id);

  return updated;
};

/// The captains list/table only carries the lightweight `captainSafeSelect`
/// shape - this composes the full picture for the dashboard's captain
/// detail page: trip stats, rating, recent trips (with client info, since
/// an admin can see everything), and the manual balance-adjustment
/// history (see WalletTransaction in schema.prisma).
export const getCaptainDetail = async (captainId: string) => {
  const captain = await captainRepo.findCaptainById(captainId);
  if (!captain) throw new CaptainNotFoundError();

  const [tripStats, ratingStats, trips, walletTransactions] =
    await Promise.all([
      tripRepo.getCaptainTripStats(captainId),
      tripRepo.getCaptainRatingStats(captainId),
      tripService.getCaptainTrips(captainId),
      captainRepo.findWalletTransactionsByCaptain(captainId),
    ]);

  return {
    captain,
    tripStats,
    ratingStats,
    recentTrips: trips.slice(0, 20),
    walletTransactions,
  };
};

const TRIPS_PAGE_SIZE = 20;

/// Every trip on the platform, filterable by status/type and searchable
/// by the client's or captain's name/phone - powers the dashboard's
/// Trips page (the previous gap: `getAllTrips` existed but nothing ever
/// called it). Search is done in-memory after attaching client/captain
/// info rather than as a DB join, which is fine at this platform's scale
/// and avoids a much more complex query.
export const getTrips = async (params: {
  status?: TripStatus;
  type?: TripType;
  search?: string;
  page?: number;
}) => {
  const trips = await tripService.getAllTrips({
    status: params.status,
    type: params.type,
  });

  const query = params.search?.trim().toLowerCase();
  const filtered = query
    ? trips.filter((t) => {
        const client = t.client as { name: string; phone: string } | null;
        const captain = t.captain as { name: string; phone: string } | null;
        return (
          client?.name.toLowerCase().includes(query) ||
          client?.phone.includes(query) ||
          captain?.name.toLowerCase().includes(query) ||
          captain?.phone.includes(query)
        );
      })
    : trips;

  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * TRIPS_PAGE_SIZE;

  return {
    trips: filtered.slice(start, start + TRIPS_PAGE_SIZE),
    total: filtered.length,
    page,
    pageSize: TRIPS_PAGE_SIZE,
  };
};

/// Positive `amount` charges the captain more (they now owe the platform
/// more), negative pays them out / reduces what they owe - e.g. settling
/// a non-cash trip's fare the platform collected on their behalf. Always
/// logged as a WalletTransaction so it shows up in both this dashboard
/// and the captain's own wallet history (see trip.service.ts ->
/// getCaptainWallet).
export const adjustCaptainBalance = async (
  captainId: string,
  data: AdjustCaptainBalanceDTO,
) => {
  const captain = await captainRepo.findCaptainById(captainId);
  if (!captain) throw new CaptainNotFoundError();

  const [updated] = await Promise.all([
    captainRepo.incrementAmountDue(captainId, data.amount),
    captainRepo.createWalletTransaction(captainId, data.amount, data.reason),
  ]);

  return updated;
};
