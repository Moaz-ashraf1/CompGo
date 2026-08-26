import crypto from "crypto";

export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashRefreshToken = (rawToken: string) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};
