import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import asyncHandler from "express-async-handler";

/// Only these names are accepted, so the public endpoint can't be used to
/// stuff arbitrary strings into the table.
export const LANDING_EVENTS = [
  "home_view",
  "home_click_client_ios",
  "home_click_client_android",
  "home_click_captain_ios",
  "home_click_captain_android",
  "captain_view",
  "captain_click_ios",
  "captain_click_android",
] as const;

const bodySchema = z.object({ event: z.enum(LANDING_EVENTS) });

// Tiny per-IP limiter (this endpoint is public): 60 events / minute.
const hits = new Map<string, { n: number; reset: number }>();
const allow = (ip: string) => {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || rec.reset < now) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return true;
  }
  rec.n += 1;
  return rec.n <= 60;
};

export const track = (req: Request, res: Response) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined) ??
    req.ip ??
    "unknown";
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json({ status: "fail" });
    return;
  }
  if (!allow(ip)) {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({ status: "fail" });
    return;
  }
  void prisma.landingEvent
    .create({ data: { event: parsed.data.event } })
    .catch(() => undefined);
  res.status(StatusCodes.NO_CONTENT).end();
};

/// Admin: counts per event (total + per day) for the last `days` days.
export const stats = asyncHandler(async (req: Request, res: Response) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.landingEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { event: true, createdAt: true },
  });
  const totals: Record<string, number> = {};
  const byDay: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    totals[r.event] = (totals[r.event] ?? 0) + 1;
    const day = r.createdAt.toISOString().slice(0, 10);
    byDay[day] ??= {};
    byDay[day][r.event] = (byDay[day][r.event] ?? 0) + 1;
  }
  res.status(StatusCodes.OK).json({
    status: "success",
    data: { days, totals, byDay },
  });
});
