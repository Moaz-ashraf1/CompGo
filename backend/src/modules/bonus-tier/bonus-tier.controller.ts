import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as bonusTierService from "./bonus-tier.service.js";

export const getAllBonusTiers = asyncHandler(
  async (_req: Request, res: Response) => {
    const tiers = await bonusTierService.getAllBonusTiers();
    res.status(StatusCodes.OK).json({ status: "success", data: tiers });
  },
);

export const createBonusTier = asyncHandler(
  async (req: Request, res: Response) => {
    const tier = await bonusTierService.createBonusTier(req.body);
    res.status(StatusCodes.CREATED).json({
      message: "Bonus tier created successfully",
      data: tier,
    });
  },
);

export const updateBonusTier = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const tier = await bonusTierService.updateBonusTier(id as string, req.body);
    res.status(StatusCodes.OK).json({
      message: "Bonus tier updated successfully",
      data: tier,
    });
  },
);

export const deleteBonusTier = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await bonusTierService.deleteBonusTier(id as string);
    res.status(StatusCodes.OK).json({
      message: "Bonus tier deleted successfully",
    });
  },
);
