import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as boundaryService from "./compound-boundary.service.js";

export const getBoundary = asyncHandler(async (req: Request, res: Response) => {
  const boundary = await boundaryService.getBoundary();

  res.status(StatusCodes.OK).json({ data: boundary });
});

export const updateBoundary = asyncHandler(async (req: Request, res: Response) => {
  const boundary = await boundaryService.updateBoundary(req.body);

  res.status(StatusCodes.OK).json({
    message: "Compound boundary updated successfully",
    data: boundary,
  });
});