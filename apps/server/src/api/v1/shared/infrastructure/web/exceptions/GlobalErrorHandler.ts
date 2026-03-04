import { messages } from "@/config/messages";
import logger from "@/utils/logger";
import { NextFunction, Request, Response } from "express";
import { ValidateError } from "tsoa";
import { HTTPCodes } from "../../../domain/types/HTTPCodes";
import { ApiResponse } from "../http/APIResponse";
import { HttpException } from "./HTTPExceptions";

const appLogger = logger.child({ category: "GlobalErrorHandler" });

/**
 * Global Exception Handler Middleware.
 * Captures all errors thrown in the application and formats them into a standard JSON response.
 *
 * @param {unknown} err - The error object caught.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next function.
 */
export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  // Initialize default values (Internal Server Error fallback)
  let statusCode = HTTPCodes.SERVER_ERROR;
  let message = messages.errors.server.internal;
  let data: any = null;
  let errorDetails: any = err; // Raw error for logging purposes

  // Determine Error Type and Hydrate values
  if (err instanceof ValidateError) {
    statusCode = HTTPCodes.VALIDATION_ERROR;
    message = "Validation Failed";
    data = err.fields;
    errorDetails = { fields: err.fields }; // Cleaner log for validation
  } else if (err instanceof HttpException) {
    statusCode = err.statusCode;
    message = err.message;
    data = err.errors;
    errorDetails = { errors: err.errors, stack: err.stack };
  } else if (err instanceof Error) {
    // Standard JS Error (Unexpected)
    statusCode = HTTPCodes.SERVER_ERROR;
    message = err.message;
    errorDetails = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  } else {
    // Unknown error type (string, number, etc.)
    message = "Unknown error occurred";
    errorDetails = { raw: String(err) };
  }

  // Security/Privacy Sanitization for Production
  if (
    process.env.NODE_ENV === "production" &&
    statusCode === HTTPCodes.SERVER_ERROR
  ) {
    message = messages.errors.server.internal; // Hide raw SQL/Code errors from public API
  }

  // Structural Logging
  appLogger.error(
    {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      userId: req.user?.id || "anonymous",
      ip: req.ip,
      error: errorDetails,
    },
    `[API Error] ${statusCode} - ${message}`
  );

  // Send Final Response
  const response = ApiResponse.error(message, data);
  return res.status(statusCode).json(response);
}
