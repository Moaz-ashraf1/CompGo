import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "captains");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
    return;
  }
  cb(null, true);
};

export const captainDocumentsUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB لكل صورة
}).fields([
  { name: "nationalIdImage", maxCount: 1 },
  { name: "licenseImage", maxCount: 1 },
]);