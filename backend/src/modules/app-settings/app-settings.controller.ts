import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as appSettingsService from "./app-settings.service.js";

export const getSettings = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await appSettingsService.getSettings();
    res.status(StatusCodes.OK).json({ data: settings });
  },
);

export const getPublicSettings = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await appSettingsService.getPublicSettings();
    res.status(StatusCodes.OK).json({ status: "success", data: settings });
  },
);

export const updateSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const settings = await appSettingsService.updateSettings(req.body);
    res.status(StatusCodes.OK).json({
      message: "Settings updated successfully",
      data: settings,
    });
  },
);
