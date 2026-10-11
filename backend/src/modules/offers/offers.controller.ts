import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as promoService from "./promo.service.js";
import * as creditService from "./credit.service.js";
import { parseDateParam } from "../../utils/parseDateParam.js";
import type { CreditTransactionKind } from "../../generated/prisma/client.js";

const ok = (res: Response, data: unknown, status = StatusCodes.OK) =>
  res.status(status).json({ status: "success", data });

// ----- client -----

export const getMyCredit = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  ok(res, await creditService.getMyCredit(req.user!.id, page));
});

export const validatePromo = asyncHandler(
  async (req: Request, res: Response) => {
    ok(res, await promoService.validateForApp(req.user!.id, req.body.code));
  },
);

// ----- admin -----

export const getPromoCodes = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, { promoCodes: await promoService.getAll() });
});

export const createPromoCode = asyncHandler(async (req: Request, res: Response) => {
  ok(res, { promoCode: await promoService.create(req.body) }, StatusCodes.CREATED);
});

export const updatePromoCode = asyncHandler(async (req: Request, res: Response) => {
  ok(res, { promoCode: await promoService.update(req.params.id as string, req.body) });
});

export const deletePromoCode = asyncHandler(async (req: Request, res: Response) => {
  const result = await promoService.remove(req.params.id as string);
  ok(res, { deactivated: result !== null });
});

export const grantCredit = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await creditService.grant(req.body));
});

export const getCreditTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId, kind, page } = req.query as {
      clientId?: string;
      kind?: string;
      page?: string;
    };
    const kinds = ["GRANT", "CASHBACK", "WELCOME", "REDEMPTION", "REFUND"];
    ok(
      res,
      await creditService.getAllTransactions({
        page: Math.max(1, Number(page) || 1),
        clientId: clientId || undefined,
        kind: kinds.includes(kind ?? "") ? (kind as CreditTransactionKind) : undefined,
        from: parseDateParam(req.query.from, false),
        to: parseDateParam(req.query.to, true),
      }),
    );
  },
);

export const getOfferSettings = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await creditService.getSettings());
});

export const updateOfferSettings = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await creditService.updateSettings(req.body));
});
