import { messages } from "@/config/messages";
import ApiError from "@/utils/ApiError";
import { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[ERROR]: ", err);

  let statusCode = 500;
  let message = messages.errors.server.internal;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;

    // Internal error
    if (!err.isOperational) {
      statusCode = 500;
      message = messages.errors.server.internal;
    }
  }

  res.status(statusCode).json({
    status: "error",
    message,
    //stack: err.stack, // Enable for debugging
  });
};

export default errorHandler;
