import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { messages } from '@/config/messages';
import { verifyVideoStreamToken } from '@/middleware/video.middleware';

jest.mock('jsonwebtoken');
// jwt.verify has void-returning overloads; cast to jest.Mock to mock return values
const jwtVerify = jest.mocked(jwt.verify) as jest.Mock;


function buildRequest(token?: string): Request {
    return {
        query: token ? { token } : {},
    } as unknown as Request;
}

function buildRes(): Response {
    return {} as Response;
}

describe('verifyVideoStreamToken', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    it('calls next with UnauthorizedException when token is missing', () => {
        const req = buildRequest();
        const next: NextFunction = jest.fn();

        verifyVideoStreamToken(req, buildRes(), next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: messages.errors.token.missing }),
        );
    });

    it('cals next with ForbiddenException when token verification fails', () => {
        const req = buildRequest('invalid-token');
        const next: NextFunction = jest.fn();

        jwtVerify.mockImplementation(() => {
            throw new Error('invalid token');
        });

        verifyVideoStreamToken(req, buildRes(), next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: messages.errors.token.invalid }),
        );
    });

    it('attaches decoded payload to req.videoParams and calls next when token is valid', () => {
        const payload = { videoId: 'vid-1', userId: 'user-1' };
        const req = buildRequest('valid-token');
        const next: NextFunction = jest.fn();

        jwtVerify.mockReturnValue(payload);

        verifyVideoStreamToken(req, buildRes(), next);

        expect((req as unknown as Record<string, unknown>).videoParams).toEqual(payload);
        expect(next).toHaveBeenCalledWith();
    });

    it('calls next with an Error when JWT_SECRET is not configured', () => {
        delete process.env.JWT_SECRET;
        const req = buildRequest('some-token');
        const next: NextFunction = jest.fn();

        verifyVideoStreamToken(req, buildRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
