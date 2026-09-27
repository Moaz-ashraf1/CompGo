import { prisma } from "../../config/prisma.js";
import { TripStatus } from "../../generated/prisma/client.js";

export interface DateRangeParams {
  from?: Date;
  to?: Date;
}

/// `requestedAt` is used as "the date of the trip" for period filtering
/// throughout this module (except the daily completed-trips trend, which
/// is inherently about completion date) - it's set on every trip
/// regardless of how it ended, unlike completedAt/cancelledAt.
const requestedAtWhere = (params: DateRangeParams) =>
  params.from || params.to
    ? {
        requestedAt: {
          ...(params.from ? { gte: params.from } : {}),
          ...(params.to ? { lte: params.to } : {}),
        },
      }
    : {};

const completedAtWhere = (params: DateRangeParams) =>
  params.from || params.to
    ? {
        completedAt: {
          ...(params.from ? { gte: params.from } : {}),
          ...(params.to ? { lte: params.to } : {}),
        },
      }
    : {};

export const getTripCountsByStatus = async (params: DateRangeParams = {}) => {
  const rows = await prisma.trip.groupBy({
    by: ["status"],
    where: requestedAtWhere(params),
    _count: true,
  });
  return rows.map((r) => ({ status: r.status, count: r._count }));
};

export const getTripCountsByType = async (params: DateRangeParams = {}) => {
  const rows = await prisma.trip.groupBy({
    by: ["type"],
    where: requestedAtWhere(params),
    _count: true,
  });
  return rows.map((r) => ({ type: r.type, count: r._count }));
};

export const getCompletedTripRevenue = async (
  params: DateRangeParams = {},
) => {
  const agg = await prisma.trip.aggregate({
    where: { status: TripStatus.COMPLETED, ...completedAtWhere(params) },
    _sum: { price: true },
    _count: true,
  });
  return {
    totalRevenue: Number(agg._sum.price ?? 0),
    completedTripsCount: agg._count,
  };
};

/// Raw SQL since Prisma's `groupBy` can't group by a date-truncated
/// column - used for the reports page's daily trend chart (trip count and
/// revenue together so the chart/export can show both). Falls back to the
/// last `fallbackDays` when no explicit range is given.
export const getDailyCompletedTripCounts = async (
  params: DateRangeParams & { fallbackDays: number },
) => {
  const from = params.from ?? new Date(Date.now() - params.fallbackDays * 86400000);
  const to = params.to ?? new Date();
  return prisma.$queryRaw<{ day: Date; count: bigint; revenue: string }[]>`
    SELECT DATE("completedAt") as day, COUNT(*)::bigint as count,
      COALESCE(SUM(price), 0)::numeric as revenue
    FROM "Trip"
    WHERE status = 'COMPLETED'
      AND "completedAt" >= ${from}
      AND "completedAt" <= ${to}
    GROUP BY DATE("completedAt")
    ORDER BY day ASC
  `;
};

export const getRevenueByType = async (params: DateRangeParams = {}) => {
  const rows = await prisma.trip.groupBy({
    by: ["type"],
    where: { status: TripStatus.COMPLETED, ...completedAtWhere(params) },
    _sum: { price: true },
    _count: true,
  });
  return rows.map((r) => ({
    type: r.type,
    revenue: Number(r._sum.price ?? 0),
    completedCount: r._count,
  }));
};

/// Scoped to the same period as the rest of the report when one is given -
/// all-time otherwise.
export const getCancellationStats = async (params: DateRangeParams = {}) => {
  const dateWhere = requestedAtWhere(params);
  const [totalTrips, cancelledTrips] = await Promise.all([
    prisma.trip.count({ where: dateWhere }),
    prisma.trip.count({
      where: { status: TripStatus.CANCELLED, ...dateWhere },
    }),
  ]);
  return { totalTrips, cancelledTrips };
};

/// Sorted/limited in application code rather than the query itself -
/// simpler and version-safe than Prisma's `groupBy` orderBy-by-aggregate
/// syntax for a list this small.
export const getCompletedTripCountsByCaptain = async (
  params: DateRangeParams = {},
) => {
  const rows = await prisma.trip.groupBy({
    by: ["captainId"],
    where: {
      status: TripStatus.COMPLETED,
      captainId: { not: null },
      ...completedAtWhere(params),
    },
    _count: true,
  });
  return rows.map((r) => ({
    captainId: r.captainId as string,
    tripCount: r._count,
  }));
};

/// Per-captain, split by inside/outside-compound - the raw material for
/// the dashboard's "company commission by captain" report (see
/// reports.service.ts -> getCaptainCommissionsReport). Only COMPLETED
/// trips count, same as every other revenue figure in this module -
/// commission is only actually realized once a trip finishes.
export const getCaptainCommissionBreakdown = async (params: {
  from?: Date;
  to?: Date;
}) => {
  const rows = await prisma.trip.groupBy({
    by: ["captainId", "isInsideCompound"],
    where: {
      status: TripStatus.COMPLETED,
      captainId: { not: null },
      ...(params.from || params.to
        ? {
            completedAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    },
    _sum: { price: true },
    _count: true,
  });
  return rows.map((r) => ({
    captainId: r.captainId as string,
    isInsideCompound: r.isInsideCompound,
    tripCount: r._count,
    revenue: Number(r._sum.price ?? 0),
  }));
};

/// Captain-initiated cancellations only (see Trip.cancelledBy) within an
/// optional date range - the raw material for the bonus report's
/// cancellation-count criterion (see reports.service.ts ->
/// getCaptainBonusesReport).
export const getCaptainCancellationCounts = async (params: {
  from?: Date;
  to?: Date;
}) => {
  const rows = await prisma.trip.groupBy({
    by: ["captainId"],
    where: {
      status: TripStatus.CANCELLED,
      cancelledBy: "CAPTAIN",
      captainId: { not: null },
      ...(params.from || params.to
        ? {
            cancelledAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    },
    _count: true,
  });
  return rows.map((r) => ({
    captainId: r.captainId as string,
    cancellationCount: r._count,
  }));
};

/// Average client rating per captain, over trips rated within an optional
/// date range (only COMPLETED trips ever have a rating) - the raw material
/// for the bonus report's rating criterion.
export const getCaptainAvgRatings = async (params: {
  from?: Date;
  to?: Date;
}) => {
  const rows = await prisma.trip.groupBy({
    by: ["captainId"],
    where: {
      rating: { not: null },
      captainId: { not: null },
      ...(params.from || params.to
        ? {
            completedAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    },
    _avg: { rating: true },
  });
  return rows.map((r) => ({
    captainId: r.captainId as string,
    avgRating: r._avg.rating,
  }));
};

export const getAccountCounts = async () => {
  const [totalCaptains, totalClients] = await Promise.all([
    prisma.captain.count(),
    prisma.client.count(),
  ]);
  return { totalCaptains, totalClients };
};
