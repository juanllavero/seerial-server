import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  ForbiddenException,
  UnauthorizedException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import { getJwtSecret } from '@/utils/jwt-secret';

declare global {
  namespace Express {
    interface Request {
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      videoParams?: any;
    }
  }
}

export const verifyVideoStreamToken = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.query.token as string;

  if (!token) {
    return next(new UnauthorizedException(messages.errors.token.missing));
  }

  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret);
    req.videoParams = decoded;
    next();
  } catch (_error) {
    return next(new ForbiddenException(messages.errors.token.invalid));
  }
};
