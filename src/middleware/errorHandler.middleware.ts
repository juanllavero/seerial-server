import logger from "@/utils/logger";
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";

const appLogger = logger.child({ category: "Application" });

export const errorHandlerMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.statusCode || err.status || 500;

  appLogger.error(
    {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status,
      userId: req.user?.id,

      // Error Logging
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
    },
    "Application error"
  );

  res.status(status).json({
    success: false,
    error: {
      status: status,
      code: err.name || "INTERNAL_ERROR",
      message: err.message ? err.message : "Something went wrong",
    },
  });
};
