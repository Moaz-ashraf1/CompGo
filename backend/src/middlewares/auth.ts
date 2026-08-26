import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyAccessToken, type AccountRole } from "../utils/jwt.js";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: "fail",
      message: "Missing or invalid Authorization header",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      familyId: payload.familyId,
    };
    next();
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: "fail",
      message: "Invalid or expired access token",
    });
  }
};

export const authorize = (...roles: AccountRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(StatusCodes.FORBIDDEN).json({
        status: "fail",
        message: "You don't have permission to access this resource",
      });
      return;
    }
    next();
  };
};
