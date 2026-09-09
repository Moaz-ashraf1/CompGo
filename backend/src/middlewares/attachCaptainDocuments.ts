import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export const attachCaptainDocuments = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const files = req.files as
    | { [field: string]: Express.Multer.File[] }
    | undefined;

  const nationalIdFile = files?.nationalIdImage?.[0];
  const licenseFile = files?.licenseImage?.[0];

  if (!nationalIdFile || !licenseFile) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: "fail",
      message: "nationalIdImage and licenseImage files are required",
    });
    return;
  }

  req.body.nationalIdImage = `/uploads/captains/${nationalIdFile.filename}`;
  req.body.licenseImage = `/uploads/captains/${licenseFile.filename}`;

  next();
};
