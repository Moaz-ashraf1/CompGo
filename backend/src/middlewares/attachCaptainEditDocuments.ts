import type { Request, Response, NextFunction } from "express";

const FIELDS = [
  "profilePhoto",
  "nationalIdImage",
  "licenseImage",
  "vehicleLicenseImage",
  "vehiclePhoto",
] as const;

/// Admin edit variant of attachCaptainDocuments: every file is optional, and
/// only the ones actually uploaded are mapped onto the body.
export const attachCaptainEditDocuments = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const files = req.files as
    | { [field: string]: Express.Multer.File[] }
    | undefined;
  for (const field of FIELDS) {
    const file = files?.[field]?.[0];
    if (file) req.body[field] = `/uploads/captains/${file.filename}`;
  }
  next();
};
