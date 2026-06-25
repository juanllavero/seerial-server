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

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as Record<string, unknown>;
    if (!decoded || typeof decoded !== 'object') {
      return next(new ForbiddenException(messages.errors.token.invalid));
    }

    if (Object.hasOwn(decoded, 'path')) {
      const videoPath = decoded.path;
      if (typeof videoPath !== 'string' || !videoPath.trim()) {
        return next(new ForbiddenException(messages.errors.token.invalid));
      }
    }

    if (Object.hasOwn(decoded, 'start')) {
      const start = decoded.start;
      if (typeof start !== 'number' && typeof start !== 'string') {
        return next(new ForbiddenException(messages.errors.token.invalid));
      }
    }

    if (Object.hasOwn(decoded, 'audio')) {
      const audio = decoded.audio;
      if (typeof audio !== 'number' && typeof audio !== 'string') {
        return next(new ForbiddenException(messages.errors.token.invalid));
      }
    }

    if (Object.hasOwn(decoded, 'quality')) {
      const quality = decoded.quality;
      if (typeof quality !== 'string' && typeof quality !== 'number') {
        return next(new ForbiddenException(messages.errors.token.invalid));
      }
    }

    if (Object.hasOwn(decoded, 'bitrate')) {
      const bitrate = decoded.bitrate;
      if (typeof bitrate !== 'number' && typeof bitrate !== 'string') {
        return next(new ForbiddenException(messages.errors.token.invalid));
      }
    }

    if (!Object.hasOwn(decoded, 'path') && !Object.hasOwn(decoded, 'videoId')) {
      return next(new ForbiddenException(messages.errors.token.invalid));
    }

    req.videoParams = decoded;
    next();
  } catch (_error) {
    return next(new ForbiddenException(messages.errors.token.invalid));
  }
};
