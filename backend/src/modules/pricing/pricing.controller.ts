import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as pricingService from "./pricing.service.js";

export const getPricing = asyncHandler(async (req: Request, res: Response) => {
  const pricing = await pricingService.getPricing();

  res.status(StatusCodes.OK).json({ data: pricing });
});

export const getPublicPricing = asyncHandler(
  async (req: Request, res: Response) => {
    const pricing = await pricingService.getPublicPricing();
    res.status(StatusCodes.OK).json({ status: "success", data: pricing });
  },
);

export const updatePricing = asyncHandler(async (req: Request, res: Response) => {
  const pricing = await pricingService.updatePricing(req.body);

  res.status(StatusCodes.OK).json({
    message: "Pricing updated successfully",
    data: pricing,
  });
});