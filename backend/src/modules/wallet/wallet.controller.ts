import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as ledgerService from "./ledger.service.js";
import { LEDGER_TYPES, type LedgerType } from "./ledger.service.js";
import { parseDateParam } from "../../utils/parseDateParam.js";

export const getMyTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, page } = req.query as { type?: string; page?: string };
    const result = await ledgerService.getCaptainLedger(req.user!.id, {
      from: parseDateParam(req.query.from, false),
      to: parseDateParam(req.query.to, true),
      type: LEDGER_TYPES.includes(type as LedgerType)
        ? (type as LedgerType)
        : undefined,
      page: page ? Number(page) : undefined,
    });
    res.status(StatusCodes.OK).json({ status: "success", data: result });
  },
);
