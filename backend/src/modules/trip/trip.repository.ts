import { prisma } from "../../config/prisma.js";
import { Prisma, TripStatus, TripType } from "../../generated/prisma/client.js";

export const createTrip = async (data: Prisma.TripUncheckedCreateInput) => {
  return await prisma.trip.create({ data });
};

export const findTripsByClient = async (clientId: string) => {
  return prisma.trip.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
};

export const findTripsByCaptain = async (
  captainId: string,
  filters: { type?: TripType; status?: TripStatus } = {},
) => {
  return prisma.trip.findMany({
    where: {
      captainId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
};

export const findAvailableTrips = async () => {
  return prisma.trip.findMany({
    where: { status: TripStatus.REQUESTED },
    orderBy: { requestedAt: "asc" },
  });
};

export const findAllTrips = async () => {
  return prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const acceptTrip = async (tripId: string, captainId: string) => {
  const result = await prisma.trip.updateMany({
    where: { id: tripId, status: TripStatus.REQUESTED },
    data: { captainId, status: TripStatus.ACCEPTED, acceptedAt: new Date() },
  });

  return result.count > 0;
};

export const updateTripStatus = async (
  id: string,
  data: Prisma.TripUncheckedUpdateInput,
) => {
  return prisma.trip.update({ where: { id }, data });
};

export const getCaptainTripStats = async (captainId: string) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [completedTripsCount, todayAgg, monthAgg] = await Promise.all([
    prisma.trip.count({
      where: { captainId, status: TripStatus.COMPLETED },
    }),
    prisma.trip.aggregate({
      where: {
        captainId,
        status: TripStatus.COMPLETED,
        completedAt: { gte: startOfDay },
      },
      _sum: { price: true },
      _count: { _all: true },
    }),
    prisma.trip.aggregate({
      where: {
        captainId,
        status: TripStatus.COMPLETED,
        completedAt: { gte: startOfMonth },
      },
      _sum: { price: true },
    }),
  ]);
  return {
    completedTripsCount,
    todayEarnings: Number(todayAgg._sum.price ?? 0),
    todayTripsCount: todayAgg._count._all,
    monthlyEarnings: Number(monthAgg._sum.price ?? 0),
  };
};

export const findRecentCompletedTrips = async (
  captainId: string,
  limit = 10,
) => {
  return prisma.trip.findMany({
    where: { captainId, status: TripStatus.COMPLETED },
    orderBy: { completedAt: "desc" },
    take: limit,
  });
};

export const findTripById = async (tripId: string) => {
  return prisma.trip.findUnique({ where: { id: tripId } });
};

export const getCaptainRatingStats = async (captainId: string) => {
  const agg = await prisma.trip.aggregate({
    where: { captainId, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return { avgRating: agg._avg.rating, ratingsCount: agg._count.rating };
};

/// Batch version of `getCaptainRatingStats` for attaching a captain's
/// rating alongside their public trip info (see trip.service.ts ->
/// attachCaptainInfo) without one aggregate query per trip.
export const getCaptainRatingStatsByIds = async (captainIds: string[]) => {
  if (captainIds.length === 0) return [];
  return prisma.trip.groupBy({
    by: ["captainId"],
    where: { captainId: { in: captainIds }, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });
};
