import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AppException } from "../exceptions/AppException.js";
import { logger } from './../config/logger.js';

const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Unhandled error", {
    message: err.message,
    name: err.name,
    url: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  if (err instanceof AppException) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message: "Internal server error",
  });
};

export default globalErrorHandler;