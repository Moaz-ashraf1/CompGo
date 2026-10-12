import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "express-async-handler";
import * as service from "./family.service.js";
import type { FamilyLinkStatus } from "../../generated/prisma/client.js";

const ok = (res: Response, data: unknown, status = StatusCodes.OK) =>
  res.status(status).json({ status: "success", data });

// ----- client -----

export const list = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await service.list(req.user!.id));
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  ok(res, { person: await service.search(req.user!.id, String(req.query.phone ?? "")) });
});

export const sendRequest = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await service.sendRequest(req.user!.id, req.body.targetId, req.body.relation), StatusCodes.CREATED);
});

export const respond = asyncHandler(async (req: Request, res: Response) => {
  await service.respond(req.user!.id, req.params.id as string, req.body.accept);
  ok(res, null);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.remove(req.user!.id, req.params.id as string);
  ok(res, null);
});

// ----- admin -----

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const { status, search } = req.query as { status?: string; search?: string };
  const valid = ["PENDING", "ACCEPTED", "REJECTED"];
  ok(res, {
    links: await service.adminList({
      status: valid.includes(status ?? "") ? (status as FamilyLinkStatus) : undefined,
      search,
    }),
  });
});

export const adminRemove = asyncHandler(async (req: Request, res: Response) => {
  await service.adminRemove(req.params.id as string);
  ok(res, null);
});
