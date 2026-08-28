import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as clientService from "./client.service.js";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.getMe(req.user!.id);

  res.status(StatusCodes.OK).json({
    status: "success",
    data: { client },
  });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.updateMe(req.user!.id, req.body);

  res.status(StatusCodes.OK).json({
    status: "success",
    data: { client },
  });
});
