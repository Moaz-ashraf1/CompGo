import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as captainService from "./captain.service.js";
import asyncHandler from "express-async-handler";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const captain = await captainService.getMe(req.user!.id);

  res.status(StatusCodes.OK).json({
    status: "success",
    data: { captain },
  });
});

export const getAllCaptains = asyncHandler(
  async (req: Request, res: Response) => {
    const captains = await captainService.getAllCaptains();

    res.status(StatusCodes.OK).json({
      data: captains,
    });
  },
);

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const captain = await captainService.updateMe(req.user!.id, req.body);

  res.status(StatusCodes.OK).json({
    status: "success",
    data: { captain },
  });
});

export const getCaptainById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const captain = await captainService.getCaptainById(id as string);

    res.status(StatusCodes.OK).json({
      data: captain,
    });
  },
);

export const blockCaptain = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const captain = await captainService.blockCaptain(id as string);

    res.status(StatusCodes.OK).json({
      message: "Captain blocked successfully",
      data: captain,
    });
  },
);

export const unblockCaptain = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const captain = await captainService.unblockCaptain(id as string);

    res.status(StatusCodes.OK).json({
      message: "Captain unblocked successfully",
      data: captain,
    });
  },
);

export const resetAmountDue = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const captain = await captainService.resetAmountDue(id as string);

    res.status(StatusCodes.OK).json({
      message: "Captain amount due reset successfully",
      data: captain,
    });
  },
);
