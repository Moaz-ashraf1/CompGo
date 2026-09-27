import * as reportsRepo from "./reports.repository.js";
import * as captainRepo from "../captain/captain.repository.js";
import * as tripRepo from "../trip/trip.repository.js";
import * as deviceTokenRepo from "../device-token/device-token.repository.js";
import * as pricingRepo from "../pricing/pricing.repository.js";

const TOP_CAPTAINS_LIMIT = 5;
const DAILY_TREND_DAYS = 14;

export const getOverviewReport = async () => {
  const [
    byStatus,
    byType,
    revenue,
    daily,
    completedByCaptain,
    accounts,
    pushEnabledCaptains,
    pushEnabledClients,
    revenueByType,
    cancellationStats,
  ] = await Promise.all([
    reportsRepo.getTripCountsByStatus(),
    reportsRepo.getTripCountsByType(),
    reportsRepo.getCompletedTripRevenue(),
    reportsRepo.getDailyCompletedTripCounts(DAILY_TREND_DAYS),
    reportsRepo.getCompletedTripCountsByCaptain(),
    reportsRepo.getAccountCounts(),
    deviceTokenRepo.countDistinctAccountsByRole("CAPTAIN"),
    deviceTokenRepo.countDistinctAccountsByRole("CLIENT"),
    reportsRepo.getRevenueByType(),
    reportsRepo.getCancellationStats(),
  ]);

  const topRaw = [...completedByCaptain]
    .sort((a, b) => b.tripCount - a.tripCount)
    .slice(0, TOP_CAPTAINS_LIMIT);
  const topCaptainIds = topRaw.map((t) => t.captainId);

  const [captains, ratingStats] = await Promise.all([
    captainRepo.findCaptainsPublicByIds(topCaptainIds),
    tripRepo.getCaptainRatingStatsByIds(topCaptainIds),
  ]);
  const captainById = new Map(captains.map((c) => [c.id, c]));
  const ratingById = new Map(ratingStats.map((r) => [r.captainId as string, r]));

  const topCaptains = topRaw.map((t) => ({
    captainId: t.captainId,
    name: captainById.get(t.captainId)?.name ?? null,
    tripCount: t.tripCount,
    avgRating: ratingById.get(t.captainId)?._avg.rating ?? null,
  }));

  const avgTripPrice =
    revenue.completedTripsCount > 0
      ? revenue.totalRevenue / revenue.completedTripsCount
      : 0;
  const cancellationRate =
    cancellationStats.totalTrips > 0
      ? (cancellationStats.cancelledTrips / cancellationStats.totalTrips) * 100
      : 0;

  return {
    totalRevenue: revenue.totalRevenue,
    completedTripsCount: revenue.completedTripsCount,
    avgTripPrice,
    cancellationRate,
    cancelledTripsCount: cancellationStats.cancelledTrips,
    totalTripsCount: cancellationStats.totalTrips,
    tripsByStatus: byStatus,
    tripsByType: byType,
    revenueByType: revenueByType.map((r) => ({
      type: r.type,
      revenue: r.revenue,
      avgPrice: r.completedCount > 0 ? r.revenue / r.completedCount : 0,
    })),
    dailyCompletedTrips: daily.map((d) => ({
      date: d.day,
      count: Number(d.count),
      revenue: Number(d.revenue),
    })),
    topCaptains,
    totalCaptains: accounts.totalCaptains,
    totalClients: accounts.totalClients,
    pushEnabledCaptains,
    pushEnabledClients,
  };
};

/// Company commission (platform's cut) from every captain's completed
/// trips, split by inside/outside-compound, optionally scoped to a date
/// range - uses the *current* commission percentage against historical
/// trip prices (same simplification the captain wallet view already
/// makes; the exact rate at the time isn't tracked per-trip).
export const getCaptainCommissionsReport = async (params: {
  from?: Date;
  to?: Date;
}) => {
  const [rows, pricing] = await Promise.all([
    reportsRepo.getCaptainCommissionBreakdown(params),
    pricingRepo.findPricingConfig(),
  ]);
  const commissionPercentage = pricing ? Number(pricing.commissionPercentage) : 0;

  const captainIds = [...new Set(rows.map((r) => r.captainId))];
  const captains = await captainRepo.findCaptainsPublicByIds(captainIds);
  const captainById = new Map(captains.map((c) => [c.id, c]));

  const byCaptain = new Map<
    string,
    {
      captainId: string;
      name: string | null;
      phone: string | null;
      insideTrips: number;
      insideRevenue: number;
      outsideTrips: number;
      outsideRevenue: number;
    }
  >();

  for (const row of rows) {
    const entry = byCaptain.get(row.captainId) ?? {
      captainId: row.captainId,
      name: captainById.get(row.captainId)?.name ?? null,
      phone: captainById.get(row.captainId)?.phone ?? null,
      insideTrips: 0,
      insideRevenue: 0,
      outsideTrips: 0,
      outsideRevenue: 0,
    };
    if (row.isInsideCompound) {
      entry.insideTrips += row.tripCount;
      entry.insideRevenue += row.revenue;
    } else {
      entry.outsideTrips += row.tripCount;
      entry.outsideRevenue += row.revenue;
    }
    byCaptain.set(row.captainId, entry);
  }

  const captainsReport = [...byCaptain.values()]
    .map((c) => {
      const totalTrips = c.insideTrips + c.outsideTrips;
      const totalRevenue = c.insideRevenue + c.outsideRevenue;
      return {
        ...c,
        totalTrips,
        totalRevenue,
        insideCommission: c.insideRevenue * (commissionPercentage / 100),
        outsideCommission: c.outsideRevenue * (commissionPercentage / 100),
        totalCommission: totalRevenue * (commissionPercentage / 100),
      };
    })
    .sort((a, b) => b.totalCommission - a.totalCommission);

  const summary = captainsReport.reduce(
    (acc, c) => ({
      totalTrips: acc.totalTrips + c.totalTrips,
      totalRevenue: acc.totalRevenue + c.totalRevenue,
      totalCommission: acc.totalCommission + c.totalCommission,
    }),
    { totalTrips: 0, totalRevenue: 0, totalCommission: 0 },
  );

  return { commissionPercentage, captains: captainsReport, summary };
};
