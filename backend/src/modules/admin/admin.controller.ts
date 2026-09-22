import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as adminService from "./admin.service.js";
import * as tripService from "../trip/trip.service.js";
import type { TripStatus, TripType } from "../../generated/prisma/client.js";

export const updateCaptainPhone = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const captain = await adminService.updateCaptainPhone(
      id as string,
      req.body,
    );

    res.status(StatusCodes.OK).json({
      status: "success",
      data: { captain },
    });
  },
);

export const resetCaptainPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await adminService.resetCaptainPassword(id as string, req.body);

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Captain password reset successfully",
    });
  },
);

export const resetClientPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    await adminService.resetClientPassword(phone, { password });

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Client password reset successfully",
    });
  },
);

export const getCaptainDetail = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const detail = await adminService.getCaptainDetail(id as string);

    res.status(StatusCodes.OK).json({ status: "success", data: detail });
  },
);

export const adjustCaptainBalance = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const captain = await adminService.adjustCaptainBalance(
      id as string,
      req.body,
    );

    res.status(StatusCodes.OK).json({ status: "success", data: { captain } });
  },
);

export const getTrips = asyncHandler(async (req: Request, res: Response) => {
  const { status, type, search, page } = req.query as {
    status?: TripStatus;
    type?: TripType;
    search?: string;
    page?: string;
  };
  const result = await adminService.getTrips({
    status,
    type,
    search,
    page: page ? Number(page) : undefined,
  });

  res.status(StatusCodes.OK).json({ status: "success", data: result });
});

export const getTripDetail = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const trip = await tripService.getTripById(id as string);

    res.status(StatusCodes.OK).json({ status: "success", data: { trip } });
  },
);

export const getTripMessages = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const messages = await adminService.getTripMessages(id as string);

    res.status(StatusCodes.OK).json({ status: "success", data: { messages } });
  },
);

export const getWalletTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { page } = req.query as { page?: string };
    const result = await adminService.getWalletTransactions({
      page: page ? Number(page) : undefined,
    });

    res.status(StatusCodes.OK).json({ status: "success", data: result });
  },
);
