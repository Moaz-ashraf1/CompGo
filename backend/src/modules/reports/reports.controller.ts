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

/// A plain "YYYY-MM-DD" `to` value is treated as end-of-day so the whole
/// day the admin picked is actually included, not excluded by a midnight
/// cutoff.
const parseDateParam = (value: unknown, endOfDay: boolean) => {
  if (typeof value !== "string" || value === "") return undefined;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = new Date(
    isDateOnly && endOfDay ? `${value}T23:59:59.999` : value,
  );
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const getCaptainCommissions = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await reportsService.getCaptainCommissionsReport({
      from: parseDateParam(req.query.from, false),
      to: parseDateParam(req.query.to, true),
    });

    res.status(StatusCodes.OK).json({ status: "success", data: report });
  },
);
