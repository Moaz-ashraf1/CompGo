import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/prisma.js";
import {
  hasPermission,
  type AdminSection,
  type PermissionLevel,
} from "../utils/adminPermissions.js";

const deny = (res: Response, status: number, message: string) =>
  res.status(status).json({ status: "fail", message });

/// Must run after `authenticate` + `authorize("ADMIN")`. Loads the admin
/// fresh from the DB on every request so a permission change (or a deleted
/// admin) takes effect immediately, not at the next login.
export const requirePermission =
  (section: AdminSection, level: PermissionLevel) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user!.id },
      select: { isSuper: true, permissions: true },
    });
    if (!admin) return deny(res, StatusCodes.UNAUTHORIZED, "Admin no longer exists");
    if (!hasPermission(admin, section, level)) {
      return deny(
        res,
        StatusCodes.FORBIDDEN,
        "ليس لديك صلاحية لتنفيذ هذا الإجراء",
      );
    }
    next();
  };

export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.user!.id },
    select: { isSuper: true },
  });
  if (!admin) return deny(res, StatusCodes.UNAUTHORIZED, "Admin no longer exists");
  if (!admin.isSuper) {
    return deny(res, StatusCodes.FORBIDDEN, "ليس لديك صلاحية لتنفيذ هذا الإجراء");
  }
  next();
};
