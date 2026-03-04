import { NextFunction, Request, Response } from "express";

/**
 * Middleware to sanitize user input for body, query and params
 */
export const sanitizationMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === "string") {
      return value.trim().slice(0, 10000); // Avoid large strings
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (typeof value === "object" && value !== null) {
      for (const key in value) {
        value[key] = sanitizeValue(value[key]);
      }
    }
    return value;
  };

  // Mutate objects without reassigning protected values
  if (req.body && typeof req.body === "object") sanitizeValue(req.body);
  if (req.query && typeof req.query === "object") sanitizeValue(req.query);
  if (req.params && typeof req.params === "object") sanitizeValue(req.params);

  next();
};
