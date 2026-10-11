import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as settlementService from "./settlement.service.js";
import { parseDateParam } from "../../utils/parseDateParam.js";
import type { SettlementStatus } from "../../generated/prisma/client.js";

export const submitSettlement = asyncHandler(
  async (req: Request, res: Response) => {
    const submission = await settlementService.submitSettlement(
      req.user!.id,
      req.body,
    );
    res
      .status(StatusCodes.CREATED)
      .json({ status: "success", data: { submission } });
  },
);

export const getMyPendingSubmission = asyncHandler(
  async (req: Request, res: Response) => {
    const submission = await settlementService.getMyPendingSubmission(
      req.user!.id,
    );
    res.status(StatusCodes.OK).json({ status: "success", data: { submission } });
  },
);

export const getAllSubmissions = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, captainId } = req.query as {
      status?: SettlementStatus;
      captainId?: string;
    };
    const submissions = await settlementService.getAllSubmissions({
      status,
      captainId: captainId || undefined,
      from: parseDateParam(req.query.from, false),
      to: parseDateParam(req.query.to, true),
    });
    res
      .status(StatusCodes.OK)
      .json({ status: "success", data: { submissions } });
  },
);

export const approveSubmission = asyncHandler(
  async (req: Request, res: Response) => {
    const submission = await settlementService.approveSubmission(
      req.params.id as string,
    );
    res.status(StatusCodes.OK).json({ status: "success", data: { submission } });
  },
);

export const rejectSubmission = asyncHandler(
  async (req: Request, res: Response) => {
    const submission = await settlementService.rejectSubmission(
      req.params.id as string,
      req.body.reason,
    );
    res.status(StatusCodes.OK).json({ status: "success", data: { submission } });
  },
);
