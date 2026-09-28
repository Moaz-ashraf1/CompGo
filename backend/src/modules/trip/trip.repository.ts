import { prisma } from "../../config/prisma.js";
import { Prisma, TripStatus, TripType } from "../../generated/prisma/client.js";

/// Every trip-fetching query below includes this so a multi-place ORDER
/// trip's checklist (see TripPlace in schema.prisma) is always available
/// wherever a trip is read - the row count is small (<=10) so this isn't
/// worth special-casing per screen.
const withPlaces = {
  places: { orderBy: { order: "asc" as const } },
} satisfies Prisma.TripInclude;

export const createTrip = async (data: Prisma.TripUncheckedCreateInput) => {
  return await prisma.trip.create({ data, include: withPlaces });
};

export const findTripPlaceById = async (placeId: string) => {
  return prisma.tripPlace.findUnique({ where: { id: placeId } });
};

export const setTripPlaceCollected = async (
  placeId: string,
  collected: boolean,
) => {
  return prisma.tripPlace.update({
    where: { id: placeId },
    data: { collected, collectedAt: collected ? new Date() : null },
  });
};

/// All-time count of trips this captain personally cancelled (see
/// Trip.cancelledBy) - the cancellation-penalty policy in
/// trip.service.ts -> cancelCaptainTrip compares this against the
/// admin-configured free limit.
export const countCaptainCancellations = async (captainId: string) => {
  return prisma.trip.count({
    where: { captainId, status: TripStatus.CANCELLED, cancelledBy: "CAPTAIN" },
  });
};

export const findTripsByClient = async (clientId: string) => {
  return prisma.trip.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: withPlaces,
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
    include: withPlaces,
  });
};

/// `visibleBefore` excludes a not-yet-due scheduled trip (see
/// trip.service.ts's LEAD_WINDOW_MS) - a trip with no `scheduledAt` is
/// always visible.
export const findAvailableTrips = async (visibleBefore: Date) => {
  return prisma.trip.findMany({
    where: {
      status: TripStatus.REQUESTED,
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: visibleBefore } }],
    },
    orderBy: { requestedAt: "asc" },
    include: withPlaces,
  });
};

/// Scheduled trips that just entered their lead window and haven't been
/// shown to captains yet - polled by the dispatcher job (see
/// src/jobs/dispatchScheduledTrips.ts).
export const findDueScheduledTrips = async (dueBefore: Date) => {
  return prisma.trip.findMany({
    where: {
      status: TripStatus.REQUESTED,
      captainId: null,
      dispatchedAt: null,
      scheduledAt: { not: null, lte: dueBefore },
    },
  });
};

export const markTripDispatched = async (id: string) => {
  await prisma.trip.update({
    where: { id },
    data: { dispatchedAt: new Date() },
  });
};

export const findAllTrips = async (
  filters: {
    status?: TripStatus;
    type?: TripType;
    isInsideCompound?: boolean;
    from?: Date;
    to?: Date;
  } = {},
) => {
  return prisma.trip.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.isInsideCompound !== undefined
        ? { isInsideCompound: filters.isInsideCompound }
        : {}),
      ...(filters.from || filters.to
        ? {
            requestedAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: withPlaces,
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
  return prisma.trip.update({ where: { id }, data, include: withPlaces });
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
    include: withPlaces,
  });
};

export const findTripById = async (tripId: string) => {
  return prisma.trip.findUnique({ where: { id: tripId }, include: withPlaces });
};

/// Used to route a captain's live location update to the right client -
/// a captain only ever has one accepted/in-progress trip at a time.
export const findActiveTripForCaptain = async (captainId: string) => {
  return prisma.trip.findFirst({
    where: {
      captainId,
      status: { in: [TripStatus.ACCEPTED, TripStatus.IN_PROGRESS] },
    },
  });
};

/// Used to block a client from requesting a second trip while one they
/// already made is still unresolved (see trip.service.ts -> requestTrip).
export const findActiveTripForClient = async (clientId: string) => {
  return prisma.trip.findFirst({
    where: {
      clientId,
      status: {
        in: [TripStatus.REQUESTED, TripStatus.ACCEPTED, TripStatus.IN_PROGRESS],
      },
    },
  });
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
