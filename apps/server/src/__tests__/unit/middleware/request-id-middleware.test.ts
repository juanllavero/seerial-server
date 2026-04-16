import type { NextFunction, Request, Response } from "express";

jest.mock("node:crypto", () => ({
	randomUUID: jest.fn(() => "req-123"),
}));

import { requestsIDsMiddleware } from "@/middleware/request.id.middleware";

describe("requestsIDsMiddleware", () => {
	it("sets request id in request and response header", () => {
		const setHeader = jest.fn();
		const next = jest.fn() as NextFunction;

		const req = {} as Request;
		const res = { setHeader } as unknown as Response;

		requestsIDsMiddleware(req, res, next);

		expect(req.requestId).toBe("req-123");
		expect(setHeader).toHaveBeenCalledWith("X-Request-Id", "req-123");
		expect(next).toHaveBeenCalledWith();
	});
});
