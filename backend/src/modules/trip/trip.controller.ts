import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as tripService from "./../trip/trip.service.js";

export const requestTrip = asyncHandler(async (req: Request, res: Response) => {
  const trip = await tripService.requestTrip(req.user!.id, req.body);
  res.status(StatusCodes.CREATED).json({ status: "success", data: { trip } });
});

export const getMyTrips = asyncHandler(async (req: Request, res: Response) => {
  const trips = await tripService.getClientTrips(req.user!.id);
  res.status(StatusCodes.OK).json({ status: "success", data: { trips } });
});

export const getTripById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trip = await tripService.getClientTripById(req.user!.id, id as string);
  res.status(StatusCodes.OK).json({ status: "success", data: { trip } });
});

export const cancelTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trip = await tripService.cancelClientTrip(
    req.user!.id,
    id as string,
    req.body,
  );
  res.status(StatusCodes.OK).json({ status: "success", data: { trip } });
});

export const rateTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trip = await tripService.rateTrip(req.user!.id, id as string, req.body);
  res.status(StatusCodes.OK).json({ status: "success", data: { trip } });
});
