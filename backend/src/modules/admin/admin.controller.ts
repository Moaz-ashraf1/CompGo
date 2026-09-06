import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as adminService from "./admin.service.js";

export const updateCaptainPhone = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const captain = await adminService.updateCaptainPhone(
      id as string,
      req.body,
    );

    res.status(StatusCodes.OK).json({
      status: "success",
      data: { captain },
    });
  },
);

export const resetCaptainPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await adminService.resetCaptainPassword(id as string, req.body);

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Captain password reset successfully",
    });
  },
);

export const resetClientPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    console.log(phone);
    console.log(password);
    await adminService.resetClientPassword(phone, { password });

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Client password reset successfully",
    });
  },
);
