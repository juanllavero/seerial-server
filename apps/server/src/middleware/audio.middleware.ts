import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
    ForbiddenException,
    UnauthorizedException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';

interface AudioStreamTokenPayload {
    userId: string;
    path: string;
}

declare global {
    namespace Express {
        interface Request {
            audioParams?: AudioStreamTokenPayload;
        }
    }
}

export const verifyAudioStreamToken = (req: Request, _res: Response, next: NextFunction) => {
    const token = req.query.token as string;

    if (!token) {
        return next(new UnauthorizedException(messages.errors.token.missing));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return next(new Error('JWT secret is not configured'));
    }

    try {
        const decoded = jwt.verify(token, secret) as AudioStreamTokenPayload;
        req.audioParams = decoded;
        next();
    } catch (_error) {
        return next(new ForbiddenException(messages.errors.token.invalid));
    }
};
