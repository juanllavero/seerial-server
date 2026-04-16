import type { NextFunction, Request, Response } from "express";
import { sanitizationMiddleware } from "@/middleware/sanitization.middleware";

function buildRequest(
	overrides: Partial<{ body: unknown; query: unknown; params: unknown }> = {},
): Request {
	return {
		body: overrides.body ?? {},
		query: overrides.query ?? {},
		params: overrides.params ?? {},
	} as unknown as Request;
}

describe("sanitizationMiddleware", () => {
	const next: NextFunction = jest.fn();
	const res = {} as Response;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("trims whitespace from string values in body", () => {
		const req = buildRequest({ body: { name: "  hello  " } });
		sanitizationMiddleware(req, res, next);
		expect((req.body as Record<string, string>).name).toBe("hello");
		expect(next).toHaveBeenCalledWith();
	});

	it("trims whitespace from string values in query", () => {
		const req = buildRequest({ query: { q: "  search  " } });
		sanitizationMiddleware(req, res, next);
		expect((req.query as Record<string, string>).q).toBe("search");
	});

	it("trims whitespace from string values in params", () => {
		const req = buildRequest({ params: { id: "  123  " } });
		sanitizationMiddleware(req, res, next);
		expect((req.params as Record<string, string>).id).toBe("123");
	});

	it("sanitizes nested objects in body", () => {
		const req = buildRequest({ body: { user: { name: "  alice  " } } });
		sanitizationMiddleware(req, res, next);
		const body = req.body as { user: { name: string } };
		expect(body.user.name).toBe("alice");
	});

	it("sanitizes all items in an array", () => {
		const req = buildRequest({ body: { tags: ["  a  ", "  b  "] } });
		sanitizationMiddleware(req, res, next);
		const body = req.body as { tags: string[] };
		expect(body.tags).toEqual(["a", "b"]);
	});

	it("truncates strings longer than 10000 characters", () => {
		const longString = "x".repeat(15000);
		const req = buildRequest({ body: { data: longString } });
		sanitizationMiddleware(req, res, next);
		const body = req.body as { data: string };
		expect(body.data.length).toBe(10000);
	});

	it("leaves non-string primitives untouched", () => {
		const req = buildRequest({ body: { count: 42, flag: true } });
		sanitizationMiddleware(req, res, next);
		const body = req.body as { count: number; flag: boolean };
		expect(body.count).toBe(42);
		expect(body.flag).toBe(true);
	});

	it("always calls next", () => {
		const req = buildRequest();
		sanitizationMiddleware(req, res, next);
		expect(next).toHaveBeenCalledWith();
	});
});
