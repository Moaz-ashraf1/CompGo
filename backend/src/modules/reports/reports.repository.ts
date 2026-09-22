import { prisma } from "../../config/prisma.js";
import { TripStatus } from "../../generated/prisma/client.js";

export const getTripCountsByStatus = async () => {
  const rows = await prisma.trip.groupBy({ by: ["status"], _count: true });
  return rows.map((r) => ({ status: r.status, count: r._count }));
};

export const getTripCountsByType = async () => {
  const rows = await prisma.trip.groupBy({ by: ["type"], _count: true });
  return rows.map((r) => ({ type: r.type, count: r._count }));
};

export const getCompletedTripRevenue = async () => {
  const agg = await prisma.trip.aggregate({
    where: { status: TripStatus.COMPLETED },
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
/// revenue together so the chart/export can show both).
export const getDailyCompletedTripCounts = async (days: number) => {
  return prisma.$queryRaw<{ day: Date; count: bigint; revenue: string }[]>`
    SELECT DATE("completedAt") as day, COUNT(*)::bigint as count,
      COALESCE(SUM(price), 0)::numeric as revenue
    FROM "Trip"
    WHERE status = 'COMPLETED'
      AND "completedAt" >= NOW() - (${days}::text || ' days')::interval
    GROUP BY DATE("completedAt")
    ORDER BY day ASC
  `;
};

export const getRevenueByType = async () => {
  const rows = await prisma.trip.groupBy({
    by: ["type"],
    where: { status: TripStatus.COMPLETED },
    _sum: { price: true },
    _count: true,
  });
  return rows.map((r) => ({
    type: r.type,
    revenue: Number(r._sum.price ?? 0),
    completedCount: r._count,
  }));
};

/// Cancellation rate is over *all* trips ever requested, not just this
/// period - matches how the rest of this report's totals (totalRevenue,
/// completedTripsCount) are all-time figures.
export const getCancellationStats = async () => {
  const [totalTrips, cancelledTrips] = await Promise.all([
    prisma.trip.count(),
    prisma.trip.count({ where: { status: TripStatus.CANCELLED } }),
  ]);
  return { totalTrips, cancelledTrips };
};

/// Sorted/limited in application code rather than the query itself -
/// simpler and version-safe than Prisma's `groupBy` orderBy-by-aggregate
/// syntax for a list this small.
export const getCompletedTripCountsByCaptain = async () => {
  const rows = await prisma.trip.groupBy({
    by: ["captainId"],
    where: { status: TripStatus.COMPLETED, captainId: { not: null } },
    _count: true,
  });
  return rows.map((r) => ({
    captainId: r.captainId as string,
    tripCount: r._count,
  }));
};

export const getAccountCounts = async () => {
  const [totalCaptains, totalClients] = await Promise.all([
    prisma.captain.count(),
    prisma.client.count(),
  ]);
  return { totalCaptains, totalClients };
};
