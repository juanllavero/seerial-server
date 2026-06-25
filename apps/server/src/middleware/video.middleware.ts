import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  ForbiddenException,
  UnauthorizedException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import { getJwtSecret } from '@/utils/jwt-secret';

const STREAM_TOKEN_RENEWAL_GRACE_SECONDS = 24 * 60 * 60;
const STREAM_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const STREAM_TOKEN_ROTATE_THRESHOLD_SECONDS = 30;
const STREAM_TOKEN_DEFAULT_EXPIRES_IN: jwt.SignOptions['expiresIn'] = '2m';

declare global {
  namespace Express {
    interface Request {
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      videoParams?: any;
    }
  }
}

function isValidVideoTokenPayload(decoded: unknown): decoded is Record<string, unknown> {
  if (!decoded || typeof decoded !== 'object') {
    return false;
  }

  const payload = decoded as Record<string, unknown>;

  if (Object.hasOwn(payload, 'path')) {
    const videoPath = payload.path;
    if (typeof videoPath !== 'string' || !videoPath.trim()) {
      return false;
    }
  }

  if (Object.hasOwn(payload, 'start')) {
    const start = payload.start;
    if (typeof start !== 'number' && typeof start !== 'string') {
      return false;
    }
  }

  if (Object.hasOwn(payload, 'audio')) {
    const audio = payload.audio;
    if (typeof audio !== 'number' && typeof audio !== 'string') {
      return false;
    }
  }

  if (Object.hasOwn(payload, 'quality')) {
    const quality = payload.quality;
    if (typeof quality !== 'string' && typeof quality !== 'number') {
      return false;
    }
  }

  if (Object.hasOwn(payload, 'bitrate')) {
    const bitrate = payload.bitrate;
    if (typeof bitrate !== 'number' && typeof bitrate !== 'string') {
      return false;
    }
  }

  return Object.hasOwn(payload, 'path') || Object.hasOwn(payload, 'videoId');
}

function asEpochSeconds(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function isTokenExpiredError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === 'TokenExpiredError') {
    return true;
  }

  return typeof jwt.TokenExpiredError === 'function' && error instanceof jwt.TokenExpiredError;
}

function stripJwtRegisteredClaims(payload: Record<string, unknown>): Record<string, unknown> {
  const { exp, iat, nbf, jti, ...customClaims } = payload;
  void exp;
  void iat;
  void nbf;
  void jti;
  return customClaims;
}

function maybeAttachRefreshedStreamToken(
  res: Response,
  secret: string,
  decodedPayload: Record<string, unknown>,
  customClaims: Record<string, unknown>,
): void {
  const exp = asEpochSeconds(decodedPayload.exp);
  if (exp === null) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const shouldRotate = exp <= now || exp - now <= STREAM_TOKEN_ROTATE_THRESHOLD_SECONDS;
  if (!shouldRotate) {
    return;
  }

  if (!isValidVideoTokenPayload(customClaims)) {
    return;
  }

  const refreshedToken = jwt.sign(customClaims, secret, {
    expiresIn: STREAM_TOKEN_DEFAULT_EXPIRES_IN,
  });

  res.setHeader('X-New-Token', refreshedToken);
}

export const verifyVideoStreamToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.query.token as string;

  if (!token) {
    return next(new UnauthorizedException(messages.errors.token.missing));
  }

  try {
    const secret = getJwtSecret();
    let decoded: unknown;

    try {
      decoded = jwt.verify(token, secret);
    } catch (error) {
      if (!isTokenExpiredError(error)) {
        throw error;
      }

      // Renewal path for active long streams: accept recently expired tokens
      // after signature validation, bounded by grace and absolute token age.
      decoded = jwt.verify(token, secret, { ignoreExpiration: true });
      const now = Math.floor(Date.now() / 1000);
      const exp = asEpochSeconds((decoded as Record<string, unknown>)?.exp);

      if (exp === null || now - exp > STREAM_TOKEN_RENEWAL_GRACE_SECONDS) {
        throw error;
      }

      const iat = asEpochSeconds((decoded as Record<string, unknown>)?.iat);
      if (iat !== null && now - iat > STREAM_TOKEN_MAX_AGE_SECONDS) {
        throw error;
      }
    }

    if (!isValidVideoTokenPayload(decoded)) {
      return next(new ForbiddenException(messages.errors.token.invalid));
    }

    const decodedPayload = decoded as Record<string, unknown>;
    const customClaims = stripJwtRegisteredClaims(decodedPayload);

    maybeAttachRefreshedStreamToken(res, secret, decodedPayload, customClaims);

    req.videoParams = customClaims;
    next();
  } catch (_error) {
    return next(new ForbiddenException(messages.errors.token.invalid));
  }
};
