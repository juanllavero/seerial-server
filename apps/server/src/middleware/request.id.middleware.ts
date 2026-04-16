import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const requestsIDsMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const requestId = randomUUID();
	req.requestId = requestId;
	res.setHeader("X-Request-Id", requestId);
	next();
};
