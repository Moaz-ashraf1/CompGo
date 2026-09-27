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

  const profilePhotoFile = files?.profilePhoto?.[0];
  const nationalIdFile = files?.nationalIdImage?.[0];
  const licenseFile = files?.licenseImage?.[0];
  const vehicleLicenseFile = files?.vehicleLicenseImage?.[0];

  if (!profilePhotoFile || !nationalIdFile || !licenseFile || !vehicleLicenseFile) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: "fail",
      message:
        "profilePhoto, nationalIdImage, licenseImage and vehicleLicenseImage files are required",
    });
    return;
  }

  req.body.profilePhoto = `/uploads/captains/${profilePhotoFile.filename}`;
  req.body.nationalIdImage = `/uploads/captains/${nationalIdFile.filename}`;
  req.body.licenseImage = `/uploads/captains/${licenseFile.filename}`;
  req.body.vehicleLicenseImage = `/uploads/captains/${vehicleLicenseFile.filename}`;

  next();
};
