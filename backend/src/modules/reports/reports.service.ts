import * as reportsRepo from "./reports.repository.js";
import * as captainRepo from "../captain/captain.repository.js";
import * as tripRepo from "../trip/trip.repository.js";
import * as deviceTokenRepo from "../device-token/device-token.repository.js";

const TOP_CAPTAINS_LIMIT = 5;
const DAILY_TREND_DAYS = 14;

export const getOverviewReport = async () => {
  const [byStatus, byType, revenue, daily, completedByCaptain, accounts, pushEnabledCaptains, pushEnabledClients] =
    await Promise.all([
      reportsRepo.getTripCountsByStatus(),
      reportsRepo.getTripCountsByType(),
      reportsRepo.getCompletedTripRevenue(),
      reportsRepo.getDailyCompletedTripCounts(DAILY_TREND_DAYS),
      reportsRepo.getCompletedTripCountsByCaptain(),
      reportsRepo.getAccountCounts(),
      deviceTokenRepo.countDistinctAccountsByRole("CAPTAIN"),
      deviceTokenRepo.countDistinctAccountsByRole("CLIENT"),
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

  return {
    totalRevenue: revenue.totalRevenue,
    completedTripsCount: revenue.completedTripsCount,
    tripsByStatus: byStatus,
    tripsByType: byType,
    dailyCompletedTrips: daily.map((d) => ({
      date: d.day,
      count: Number(d.count),
    })),
    topCaptains,
    totalCaptains: accounts.totalCaptains,
    totalClients: accounts.totalClients,
    pushEnabledCaptains,
    pushEnabledClients,
  };
};
