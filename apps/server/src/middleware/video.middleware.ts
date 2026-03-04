import {
  ForbiddenException,
  UnauthorizedException,
} from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { messages } from "@/config/messages";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      videoParams?: any;
    }
  }
}

export const verifyVideoStreamToken = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = req.query.token as string;

  if (!token) {
    return next(new UnauthorizedException(messages.errors.token.missing));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.videoParams = decoded;
    next();
  } catch (err) {
    return next(new ForbiddenException(messages.errors.token.invalid));
  }
};
