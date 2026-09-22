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

export const getAllClients = asyncHandler(
  async (req: Request, res: Response) => {
    const clients = await clientService.getAllClientsForAdmin();

    res.status(StatusCodes.OK).json({
      data: clients,
    });
  },
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    await clientService.changePassword(req.user!.id, req.body);
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Password changed successfully",
    });
  },
);

export const getClientDetail = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const detail = await clientService.getClientDetail(id as string);

    res.status(StatusCodes.OK).json({ status: "success", data: detail });
  },
);

export const blockClient = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const client = await clientService.blockClient(id as string);

    res.status(StatusCodes.OK).json({ status: "success", data: { client } });
  },
);

export const unblockClient = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const client = await clientService.unblockClient(id as string);

    res.status(StatusCodes.OK).json({ status: "success", data: { client } });
  },
);
