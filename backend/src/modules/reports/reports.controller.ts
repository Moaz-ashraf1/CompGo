import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as reportsService from "./reports.service.js";

export const getOverview = asyncHandler(
  async (_req: Request, res: Response) => {
    const overview = await reportsService.getOverviewReport();

    res.status(StatusCodes.OK).json({ status: "success", data: overview });
  },
);
