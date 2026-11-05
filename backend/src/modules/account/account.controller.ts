import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { deleteOwnAccount } from "../admin/accountDeletion.service.js";

export const deleteMyClientAccount = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteOwnAccount("CLIENT", req.user!.id, req.body.password);
    res.status(StatusCodes.OK).json({ status: "success" });
  },
);

export const deleteMyCaptainAccount = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteOwnAccount("CAPTAIN", req.user!.id, req.body.password);
    res.status(StatusCodes.OK).json({ status: "success" });
  },
);
