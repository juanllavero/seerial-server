import cookieParser from 'cookie-parser';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { globalErrorHandler } from '@/api/v1/shared/infrastructure/web/exceptions/GlobalErrorHandler';
import { RegisterRoutes } from '@/routes/routes';

export function createTestApp(): Express {
    const app = express();

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use(cookieParser());

    RegisterRoutes(app);

    // 404 handler for unmatched routes
    app.use((_req: Request, res: Response) => {
        res.status(404).json({ success: false, message: 'Not found', data: null });
    });

    app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
        globalErrorHandler(err, req, res, next);
    });

    return app;
}
