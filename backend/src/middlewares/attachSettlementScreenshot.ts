import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export const attachSettlementScreenshot = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: "fail",
      message: "screenshot file is required",
    });
    return;
  }

  req.body.screenshotUrl = `/uploads/settlements/${file.filename}`;

  next();
};
