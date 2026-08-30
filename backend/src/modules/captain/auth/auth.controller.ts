import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as authService from "./auth.service.js";

export const registerCaptain = asyncHandler(
  async (req: Request, res: Response) => {
    const captain = await authService.registerCaptain(req.body);

    res.status(StatusCodes.CREATED).json({
      status: "success",
      data: { captain },
    });
  },
);

export const loginCaptain = asyncHandler(
  async (req: Request, res: Response) => {
    const deviceId = req.headers["x-device-id"];

    if (typeof deviceId !== "string") {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: "fail",
        message: "x-device-id header is required",
      });
      return;
    }

    const result = await authService.loginCaptain(req.body, {
      deviceId,
      ipAddress: req.ip ?? "unknown",
    });

    res.status(StatusCodes.OK).json({
      status: "success",
      data: result,
    });
  },
);
