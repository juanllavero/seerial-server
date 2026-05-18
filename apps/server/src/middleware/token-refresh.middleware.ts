import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware that checks if the auth middleware flagged a near-expiry token
 * (request.refreshedToken) and, if so, injects the new token into:
 *   - X-New-Token response header (readable by Bearer-auth clients)
 *   - Set-Cookie header (refreshes the HttpOnly cookie for cookie-auth clients)
 *
 * Must be registered BEFORE RegisterRoutes so that res.json is wrapped
 * before any route handler invokes it.
 */
export function tokenRefreshMiddleware(req: Request, res: Response, next: NextFunction): void {
    const originalJson = res.json.bind(res);

    res.json = (body: unknown) => {
        const newToken = req.refreshedToken;

        if (newToken) {
            res.setHeader('X-New-Token', newToken);

            const cookie = [
                `token=${newToken}`,
                'HttpOnly',
                'Path=/',
                'SameSite=Lax',
                process.env.NODE_ENV === 'production' ? 'Secure' : null,
            ]
                .filter(Boolean)
                .join('; ');

            res.setHeader('Set-Cookie', cookie);
        }

        return originalJson(body);
    };

    next();
}
