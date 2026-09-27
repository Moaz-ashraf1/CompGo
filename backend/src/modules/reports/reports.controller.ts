import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as reportsService from "./reports.service.js";
import { parseDateParam } from "../../utils/parseDateParam.js";

export const getOverview = asyncHandler(
  async (req: Request, res: Response) => {
    const overview = await reportsService.getOverviewReport({
      from: parseDateParam(req.query.from, false),
      to: parseDateParam(req.query.to, true),
    });

    res.status(StatusCodes.OK).json({ status: "success", data: overview });
  },
);

export const getCaptainCommissions = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await reportsService.getCaptainCommissionsReport({
      from: parseDateParam(req.query.from, false),
      to: parseDateParam(req.query.to, true),
    });

    res.status(StatusCodes.OK).json({ status: "success", data: report });
  },
);

export const getCaptainBonuses = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await reportsService.getCaptainBonusesReport({
      from: parseDateParam(req.query.from, false),
      to: parseDateParam(req.query.to, true),
    });

    res.status(StatusCodes.OK).json({ status: "success", data: report });
  },
);
