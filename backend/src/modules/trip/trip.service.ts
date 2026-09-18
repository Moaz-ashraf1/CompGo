import * as tripRepo from "./trip.repository.js";
import * as boundaryRepo from "../compound-boundary/compound-boundary.repository.js";
import * as pricingRepo from "../pricing/pricing.repository.js";
import * as captainRepo from "../captain/captain.repository.js";
import { isPointInsidePolygon, haversineDistanceKm } from "../../utils/geo.js";
import { TripStatus, TripType } from "../../generated/prisma/client.js";
import type { CreateTripDTO, CancelTripDTO } from "./trip.validation.js";
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

  return tripRepo.createTrip({
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
  });
};

export const getClientTrips = async (clientId: string) => {
  return tripRepo.findTripsByClient(clientId);
};

export const getClientTripById = async (clientId: string, tripId: string) => {
  const trip = await tripRepo.findTripById(tripId);
  if (!trip) throw new TripNotFoundError();
  if (trip.clientId !== clientId) throw new NotYourTripError();
  return trip;
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

  return tripRepo.updateTripStatus(tripId, {
    status: TripStatus.CANCELLED,
    cancelledAt: new Date(),
    cancelReason: data.reason ?? null,
  });
};

export const getAvailableTrips = async () => {
  return tripRepo.findAvailableTrips();
};

export const acceptTrip = async (captainId: string, tripId: string) => {
  const trip = await tripRepo.findTripById(tripId);
  if (!trip) throw new TripNotFoundError();

  const accepted = await tripRepo.acceptTrip(tripId, captainId);
  if (!accepted) throw new TripAlreadyTakenError();

  return tripRepo.findTripById(tripId);
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

  return tripRepo.updateTripStatus(tripId, {
    status: TripStatus.IN_PROGRESS,
    startedAt: new Date(),
  });
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

  return updatedTrip;
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

  return tripRepo.updateTripStatus(tripId, {
    status: TripStatus.CANCELLED,
    cancelledAt: new Date(),
    cancelReason: data.reason ?? null,
  });
};

export const getCaptainTrips = async (
  captainId: string,
  filters: { type?: TripType; status?: TripStatus } = {},
) => {
  return tripRepo.findTripsByCaptain(captainId, filters);
};

export const getAllTrips = async () => {
  return tripRepo.findAllTrips();
};

export const getTripById = async (tripId: string) => {
  const trip = await tripRepo.findTripById(tripId);
  if (!trip) throw new TripNotFoundError();
  return trip;
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
