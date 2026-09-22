import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as notificationService from "./notification.service.js";
import type { AccountRole } from "../../generated/prisma/client.js";

export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await notificationService.getNotifications(req.user!.id);
    res.status(StatusCodes.OK).json({ status: "success", data });
  },
);

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markRead(req.params.id as string, req.user!.id);
  res.status(StatusCodes.OK).json({ status: "success" });
});

export const markAllRead = asyncHandler(
  async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user!.id);
    res.status(StatusCodes.OK).json({ status: "success" });
  },
);

export const getAllForAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { role, page } = req.query as { role?: AccountRole; page?: string };
    const result = await notificationService.getAllForAdmin({
      role,
      page: page ? Number(page) : undefined,
    });

    res.status(StatusCodes.OK).json({ status: "success", data: result });
  },
);
