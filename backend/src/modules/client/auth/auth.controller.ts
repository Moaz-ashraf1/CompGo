import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import { StatusCodes } from "http-status-codes";

export const registerClient = asyncHandler(
  async (req: Request, res: Response) => {
    const client = await authService.registerClient(req.body);

    res.status(StatusCodes.CREATED).json({
      status: "success",
      data: {
        client,
      },
    });
  },
);

export const loginClient = asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.headers["x-device-id"] as string;
  if (typeof deviceId !== "string") {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: "fail",
      message: "x-device-id header is required",
    });
    return;
  }
  const result = await authService.loginClient(req.body, {
    deviceId,
    ipAddress: req.ip ?? "unknown",
  });

  res.status(StatusCodes.OK).json({
    status: "success",
    data: result,
  });
});
