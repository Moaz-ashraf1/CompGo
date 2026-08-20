import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export const validation = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = {
      ...req.body,
      ...req.params,
      ...req.query,
    };

    const result = schema.safeParse(data);

    if (!result.success) {
      const errorMessage = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      const error = new Error(errorMessage) as any;
      error.statusCode = 400;

      return next(error);
    }

    next();
  };
};