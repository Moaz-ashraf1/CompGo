import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as deviceTokenService from "./device-token.service.js";

export const registerDeviceToken = asyncHandler(
  async (req: Request, res: Response) => {
    await deviceTokenService.registerDeviceToken(
      req.user!.id,
      req.user!.role,
      req.body,
    );
    res.status(StatusCodes.OK).json({ status: "success" });
  },
);

export const removeDeviceToken = asyncHandler(
  async (req: Request, res: Response) => {
    await deviceTokenService.removeDeviceToken(req.body.token);
    res.status(StatusCodes.OK).json({ status: "success" });
  },
);
