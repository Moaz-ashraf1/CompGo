import * as tripRepo from "./trip.repository.js";
import * as boundaryRepo from "../compound-boundary/compound-boundary.repository.js";
import * as pricingRepo from "../pricing/pricing.repository.js";
import * as captainRepo from "../captain/captain.repository.js";
import * as clientRepo from "../client/client.repo.js";
import {
  emitToClient,
  emitToCaptain,
  emitToCaptainsBroadcast,
} from "../../realtime/socket.js";
import { isPointInsidePolygon, haversineDistanceKm } from "../../utils/geo.js";
import { TripStatus, TripType } from "../../generated/prisma/client.js";
import type {
  CreateTripDTO,
  CancelTripDTO,
  RateTripDTO,
} from "./trip.validation.js";
import { CaptainNotFoundError } from "../../exceptions/captain.exceptions.js";
import {
  TripNotFoundError,
  NotYourTripError,
  InvalidTripStatusError,
  TripAlreadyTakenError,
  MissingDropoffError,
  OrderOutsideCompoundError,
  NoCompoundBoundaryError,
  NoPricingConfigError,
} from "../../exceptions/trip.exceptions.js";

// Trip rows only ever carry raw `clientId`/`captainId` strings - these
// batch-attach the *public* profile of whichever party is relevant, so
// trip responses are actually usable in the apps (who is this from/who
// picked this up). Phone numbers are only attached once a client and
// captain are already tied together by the trip (assigned captain, or a
// trip that's already "theirs"), never for the general available-trips
// list every captain can browse before anyone has accepted.
const attachClientInfo = async <T extends { clientId: string }>(
  trips: T[],
  { withPhone }: { withPhone: boolean },
) => {
  const ids = [...new Set(trips.map((t) => t.clientId))];
  const clients = withPhone
    ? await clientRepo.findClientsPublicByIds(ids)
    : await clientRepo.findClientsNameOnlyByIds(ids);
  const byId = new Map(clients.map((c) => [c.id, c]));
  return trips.map((trip) => ({ ...trip, client: byId.get(trip.clientId) ?? null }));
};

const attachCaptainInfo = async <T extends { captainId: string | null }>(
  trips: T[],
) => {
  const ids = [
    ...new Set(
      trips
        .map((t) => t.captainId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const [captains, ratingStats] = await Promise.all([
    captainRepo.findCaptainsPublicByIds(ids),
    tripRepo.getCaptainRatingStatsByIds(ids),
  ]);
  const ratingById = new Map(
    ratingStats.map((r) => [
      r.captainId as string,
      { avgRating: r._avg.rating, ratingsCount: r._count.rating },
    ]),
  );
  const byId = new Map(
    captains.map((c) => [
      c.id,
      { ...c, ...(ratingById.get(c.id) ?? { avgRating: null, ratingsCount: 0 }) },
    ]),
  );
  return trips.map((trip) => ({
    ...trip,
    captain: trip.captainId ? (byId.get(trip.captainId) ?? null) : null,
  }));
};

const attachClientInfoOne = async <T extends { clientId: string }>(
  trip: T,
  opts: { withPhone: boolean },
) => (await attachClientInfo([trip], opts))[0]!;

const attachCaptainInfoOne = async <T extends { captainId: string | null }>(
  trip: T,
) => (await attachCaptainInfo([trip]))[0]!;

const resolveIsInsideCompound = async (lat: number, lng: number) => {
  const boundary = await boundaryRepo.findBoundary();
  if (!boundary) throw new NoCompoundBoundaryError();

  const points = boundary.points as { lat: number; lng: number }[];
  return isPointInsidePolygon({ lat, lng }, points);
};

const calculatePrice = async (params: {
  type: TripType;
  isInsideCompound: boolean;
  distanceKm: number | null;
}) => {
  const pricing = await pricingRepo.findPricingConfig();
  if (!pricing) throw new NoPricingConfigError();

  if (params.type === TripType.AIRPORT) {
    return Number(pricing.airportPrice);
  }

  if (params.type === TripType.ORDER) {
    if (!params.isInsideCompound) throw new OrderOutsideCompoundError();
    return Number(pricing.orderInsideCompoundPrice);
  }

  if (params.isInsideCompound) return Number(pricing.rideInsideCompoundPrice);
  if (params.distanceKm === null) throw new MissingDropoffError();
  return params.distanceKm * Number(pricing.rideOutsidePricePerKm);
};

const AIRPORT_LABEL = "مطار القاهرة الدولي";
export const requestTrip = async (clientId: string, data: CreateTripDTO) => {
  const isInsideCompound = await resolveIsInsideCompound(
    data.pickupLat,
    data.pickupLng,
  );

  const hasDropoff =
    data.dropoffLat !== undefined && data.dropoffLng !== undefined;

  const distanceKm = hasDropoff
    ? haversineDistanceKm(
        { lat: data.pickupLat, lng: data.pickupLng },
        { lat: data.dropoffLat!, lng: data.dropoffLng! },
      )
    : null;

  const price = await calculatePrice({
    type: data.type as TripType,
    isInsideCompound,
    distanceKm,
  });

  const created = await tripRepo.createTrip({
    type: data.type,
    clientId,
    pickupLat: data.pickupLat,
    pickupLng: data.pickupLng,
    pickupLabel: data.pickupLabel,
    dropoffLat: data.dropoffLat ?? null,
    dropoffLng: data.dropoffLng ?? null,
    dropoffLabel:
      data.dropoffLabel ?? (data.type === "AIRPORT" ? AIRPORT_LABEL : null),
    isInsideCompound,
    distanceKm,
    price,
    status: TripStatus.REQUESTED,
    paymentMethod: data.paymentMethod ?? "CASH",
    scheduledAt: data.scheduledAt ?? null,
    passengers: data.passengers ?? null,
    luggageCount: data.luggageCount ?? null,
    flightNumber: data.flightNumber ?? null,
  });

  const [withClient] = await attachClientInfo([created], { withPhone: false });
  emitToCaptainsBroadcast("trip:new", withClient);

  return created;
};

export const getClientTrips = async (clientId: string) => {
  const trips = await tripRepo.findTripsByClient(clientId);
  return attachCaptainInfo(trips);
};

export const getClientTripById = async (clientId: string, tripId: string) => {
  const trip = await tripRepo.findTripById(tripId);
  if (!trip) throw new TripNotFoundError();
  if (trip.clientId !== clientId) throw new NotYourTripError();
  return attachCaptainInfoOne(trip);
};

export const rateTrip = async (
  clientId: string,
  tripId: string,
  data: RateTripDTO,
) => {
  const trip = await tripRepo.findTripById(tripId);
  if (!trip) throw new TripNotFoundError();
  if (trip.clientId !== clientId) throw new NotYourTripError();

  if (trip.status !== TripStatus.COMPLETED) {
    throw new InvalidTripStatusError("Only a completed trip can be rated");
  }
  if (trip.rating !== null) {
    throw new InvalidTripStatusError("This trip has already been rated");
  }

  const rated = await tripRepo.updateTripStatus(tripId, {
    rating: data.rating,
    ratingComment: data.comment ?? null,
  });
  return attachCaptainInfoOne(rated);
};

export const cancelClientTrip = async (
  clientId: string,
  tripId: string,
  data: CancelTripDTO,
) => {
  const trip = await getClientTripById(clientId, tripId);

  if (
    trip.status !== TripStatus.REQUESTED &&
    trip.status !== TripStatus.ACCEPTED
  ) {
    throw new InvalidTripStatusError(
      "Trip can only be cancelled before it starts",
    );
  }

  const cancelled = await tripRepo.updateTripStatus(tripId, {
    status: TripStatus.CANCELLED,
    cancelledAt: new Date(),
    cancelReason: data.reason ?? null,
  });

  if (trip.status === TripStatus.REQUESTED) {
    // Wasn't assigned yet - every captain currently browsing it needs it
    // removed from their available-trips list.
    emitToCaptainsBroadcast("trip:taken", { tripId });
  } else if (trip.captainId) {
    // Was already accepted - the assigned captain needs to know the
    // client just pulled the trip out from under them. They see this
    // trip with *client* info attached (their own normal view of it),
    // not the captain-attached shape this function returns to the client.
    const forCaptain = await attachClientInfoOne(cancelled, { withPhone: true });
    emitToCaptain(trip.captainId, "trip:updated", forCaptain);
  }

  return attachCaptainInfoOne(cancelled);
};

export const getAvailableTrips = async () => {
  const trips = await tripRepo.findAvailableTrips();
  return attachClientInfo(trips, { withPhone: false });
};

export const acceptTrip = async (captainId: string, tripId: string) => {
  const trip = await tripRepo.findTripById(tripId);
  if (!trip) throw new TripNotFoundError();

  const accepted = await tripRepo.acceptTrip(tripId, captainId);
  if (!accepted) throw new TripAlreadyTakenError();

  const updated = await tripRepo.findTripById(tripId);
  const forCaptain = await attachClientInfoOne(updated!, { withPhone: true });

  emitToCaptainsBroadcast("trip:taken", { tripId });
  // The client sees *captain* info attached (who picked them up), not the
  // client-attached shape this function returns to the accepting captain.
  emitToClient(trip.clientId, "trip:updated", await attachCaptainInfoOne(updated!));

  return forCaptain;
};

const getCaptainTripOrThrow = async (captainId: string, tripId: string) => {
  const trip = await tripRepo.findTripById(tripId);
  if (!trip) throw new TripNotFoundError();
  if (trip.captainId !== captainId) throw new NotYourTripError();
  return trip;
};

export const startTrip = async (captainId: string, tripId: string) => {
  const trip = await getCaptainTripOrThrow(captainId, tripId);

  if (trip.status !== TripStatus.ACCEPTED) {
    throw new InvalidTripStatusError(
      "Trip must be accepted before it can start",
    );
  }

  const started = await tripRepo.updateTripStatus(tripId, {
    status: TripStatus.IN_PROGRESS,
    startedAt: new Date(),
  });
  emitToClient(trip.clientId, "trip:updated", await attachCaptainInfoOne(started));
  return attachClientInfoOne(started, { withPhone: true });
};

export const completeTrip = async (captainId: string, tripId: string) => {
  const trip = await getCaptainTripOrThrow(captainId, tripId);

  if (trip.status !== TripStatus.IN_PROGRESS) {
    throw new InvalidTripStatusError(
      "Trip must be in progress before it can be completed",
    );
  }

  const pricing = await pricingRepo.findPricingConfig();
  if (!pricing) throw new NoPricingConfigError();

  const commission =
    Number(trip.price) * (Number(pricing.commissionPercentage) / 100);

  const [updatedTrip] = await Promise.all([
    tripRepo.updateTripStatus(tripId, {
      status: TripStatus.COMPLETED,
      completedAt: new Date(),
    }),
    captainRepo.incrementAmountDue(captainId, commission),
  ]);

  emitToClient(trip.clientId, "trip:updated", await attachCaptainInfoOne(updatedTrip));
  return attachClientInfoOne(updatedTrip, { withPhone: true });
};

export const cancelCaptainTrip = async (
  captainId: string,
  tripId: string,
  data: CancelTripDTO,
) => {
  const trip = await getCaptainTripOrThrow(captainId, tripId);

  if (trip.status !== TripStatus.ACCEPTED) {
    throw new InvalidTripStatusError(
      "Only an accepted trip can be cancelled by the captain",
    );
  }

  const cancelled = await tripRepo.updateTripStatus(tripId, {
    status: TripStatus.CANCELLED,
    cancelledAt: new Date(),
    cancelReason: data.reason ?? null,
  });
  emitToClient(trip.clientId, "trip:updated", await attachCaptainInfoOne(cancelled));
  return attachClientInfoOne(cancelled, { withPhone: true });
};

export const getCaptainTrips = async (
  captainId: string,
  filters: { type?: TripType; status?: TripStatus } = {},
) => {
  const trips = await tripRepo.findTripsByCaptain(captainId, filters);
  return attachClientInfo(trips, { withPhone: true });
};

export const getAllTrips = async () => {
  const trips = await tripRepo.findAllTrips();
  return attachCaptainInfo(await attachClientInfo(trips, { withPhone: true }));
};

export const getTripById = async (tripId: string) => {
  const trip = await tripRepo.findTripById(tripId);
  if (!trip) throw new TripNotFoundError();
  return attachCaptainInfoOne(await attachClientInfoOne(trip, { withPhone: true }));
};

export const getCaptainWallet = async (captainId: string) => {
  const [captain, stats, recentTrips, pricing] = await Promise.all([
    captainRepo.findCaptainById(captainId),
    tripRepo.getCaptainTripStats(captainId),
    tripRepo.findRecentCompletedTrips(captainId),
    pricingRepo.findPricingConfig(),
  ]);

  if (!captain) throw new CaptainNotFoundError();

  const commissionPercentage = pricing
    ? Number(pricing.commissionPercentage)
    : 0;

  const recentTransactions = recentTrips.flatMap((trip) => {
    const commission = Number(trip.price) * (commissionPercentage / 100);
    return [
      {
        type: "TRIP_FARE" as const,
        tripId: trip.id,
        amount: Number(trip.price),
        occurredAt: trip.completedAt,
      },
      {
        type: "PLATFORM_COMMISSION" as const,
        tripId: trip.id,
        amount: -commission,
        occurredAt: trip.completedAt,
      },
    ];
  });

  return {
    amountDue: Number(captain.amountDue),
    completedTripsCount: stats.completedTripsCount,
    todayEarnings: stats.todayEarnings,
    todayTripsCount: stats.todayTripsCount,
    monthlyEarnings: stats.monthlyEarnings,
    recentTransactions,
  };
};

export const getCaptainRatingStats = async (captainId: string) => {
  return tripRepo.getCaptainRatingStats(captainId);
};

export const notifyCaptainLocationUpdate = async (
  captainId: string,
  lat: number,
  lng: number,
) => {
  const trip = await tripRepo.findActiveTripForCaptain(captainId);
  if (!trip) return;
  emitToClient(trip.clientId, "captain:location", {
    tripId: trip.id,
    lat,
    lng,
    updatedAt: new Date().toISOString(),
  });
};
