import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as service from "./admin-users.service.js";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const admin = await service.getMe(req.user!.id);
  res.status(StatusCodes.OK).json({ status: "success", data: { admin } });
});

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const admins = await service.getAll();
  res.status(StatusCodes.OK).json({ status: "success", data: { admins } });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const admin = await service.createAdmin(req.body);
  res.status(StatusCodes.CREATED).json({ status: "success", data: { admin } });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const admin = await service.updateAdmin(req.params.id as string, req.body);
  res.status(StatusCodes.OK).json({ status: "success", data: { admin } });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteAdmin(req.params.id as string);
  res.status(StatusCodes.OK).json({ status: "success", data: null });
});
