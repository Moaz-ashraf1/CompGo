import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
    return;
  }
  cb(null, true);
};

const diskStorageIn = (subdir: string) => {
  const dir = path.join(process.cwd(), "uploads", subdir);
  fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
};

export const captainDocumentsUpload = multer({
  storage: diskStorageIn("captains"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "nationalIdImage", maxCount: 1 },
  { name: "licenseImage", maxCount: 1 },
  { name: "vehicleLicenseImage", maxCount: 1 },
]);

/// Proof-of-payment screenshot a captain attaches when submitting a
/// settlement (see settlement.service.ts -> submitSettlement).
export const settlementScreenshotUpload = multer({
  storage: diskStorageIn("settlements"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("screenshot");