import * as reportsRepo from "./reports.repository.js";
import * as captainRepo from "../captain/captain.repository.js";
import * as tripRepo from "../trip/trip.repository.js";
import * as deviceTokenRepo from "../device-token/device-token.repository.js";

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
