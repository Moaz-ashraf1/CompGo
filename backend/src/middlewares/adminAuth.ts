import "dotenv/config";
import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminKey = req.headers["x-admin-key"];
  const expectedKey = process.env.ADMIN_KEY!;
  console.log(adminKey, expectedKey);

  if (typeof adminKey !== "string" || adminKey.length !== expectedKey.length) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: "fail",
      message: "Unauthorized",
    });
    return;
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(adminKey),
    Buffer.from(expectedKey),
  );

  if (!isValid) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: "fail",
      message: "Invalid or missing admin key",
    });
    return;
  }
  next();
};
