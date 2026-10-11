import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyAccessToken, type AccountRole } from "../utils/jwt.js";
import { isAccountBlocked, ACCOUNT_BLOCKED_MESSAGE } from "../utils/accountStatus.js";

export const authenticate = async (
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

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: "fail",
      message: "Invalid or expired access token",
    });
    return;
  }

  if (await isAccountBlocked(payload.role, payload.sub)) {
    res.status(StatusCodes.FORBIDDEN).json({
      status: "fail",
      code: "ACCOUNT_BLOCKED",
      message: ACCOUNT_BLOCKED_MESSAGE,
    });
    return;
  }

  req.user = {
    id: payload.sub,
    role: payload.role,
    familyId: payload.familyId,
  };
  next();
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
