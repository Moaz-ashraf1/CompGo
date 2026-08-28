import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as authService from "./auth.service.js";

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const deviceId = req.headers["x-device-id"];

  if (typeof refreshToken !== "string" || typeof deviceId !== "string") {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: "fail",
      message: "refreshToken and x-device-id are required",
    });
    return;
  }

  const result = await authService.rotateRefreshToken({
    rawRefreshToken: refreshToken,
    deviceId,
    ipAddress: req.ip ?? "unknown",
  });

  res.status(StatusCodes.OK).json({
    status: "success",
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.familyId);

  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Logged out successfully",
  });
});
