import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as tripService from "../../trip/trip.service.js";
import type { TripType, TripStatus } from "../../../generated/prisma/client.js";

export const getAvailableTrips = asyncHandler(
  async (req: Request, res: Response) => {
    const trips = await tripService.getAvailableTrips(req.user!.id);
    res.status(StatusCodes.OK).json({ status: "success", data: { trips } });
  },
);

export const acceptTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trip = await tripService.acceptTrip(req.user!.id, id as string);
  res.status(StatusCodes.OK).json({ status: "success", data: { trip } });
});

export const startTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trip = await tripService.startTrip(req.user!.id, id as string);
  res.status(StatusCodes.OK).json({ status: "success", data: { trip } });
});

export const completeTrip = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const trip = await tripService.completeTrip(req.user!.id, id as string);
    res.status(StatusCodes.OK).json({ status: "success", data: { trip } });
  },
);

export const cancelTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trip = await tripService.cancelCaptainTrip(
    req.user!.id,
    id as string,
    req.body,
  );
  res.status(StatusCodes.OK).json({ status: "success", data: { trip } });
});

export const getMyTrips = asyncHandler(async (req: Request, res: Response) => {
  const { type, status } = req.query as {
    type?: TripType;
    status?: TripStatus;
  };
  const trips = await tripService.getCaptainTrips(req.user!.id, {
    type,
    status,
  });
  res.status(StatusCodes.OK).json({ status: "success", data: { trips } });
});
