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
