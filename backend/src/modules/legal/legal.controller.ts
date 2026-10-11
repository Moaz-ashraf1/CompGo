import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as service from "./legal.service.js";

export const getPublic = asyncHandler(async (req: Request, res: Response) => {
  const key = service.parseKey(req.params.key as string);
  res
    .status(StatusCodes.OK)
    .json({ status: "success", data: await service.getPublic(key) });
});

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  res
    .status(StatusCodes.OK)
    .json({ status: "success", data: { pages: await service.getAllForAdmin() } });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const key = service.parseKey(req.params.key as string);
  res
    .status(StatusCodes.OK)
    .json({ status: "success", data: { page: await service.update(key, req.body) } });
});

export const reset = asyncHandler(async (req: Request, res: Response) => {
  await service.reset(service.parseKey(req.params.key as string));
  res.status(StatusCodes.OK).json({ status: "success", data: null });
});
