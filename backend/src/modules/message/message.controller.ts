import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as messageService from "./message.service.js";

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await messageService.sendMessage(
    req.params.id as string,
    req.user!.id,
    req.user!.role,
    req.body.body,
  );
  res.status(StatusCodes.CREATED).json({ status: "success", data: { message } });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const messages = await messageService.getMessages(
    req.params.id as string,
    req.user!.id,
    req.user!.role,
  );
  res.status(StatusCodes.OK).json({ status: "success", data: { messages } });
});
