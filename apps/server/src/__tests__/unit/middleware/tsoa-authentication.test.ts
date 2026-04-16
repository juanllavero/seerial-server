import type { Request } from "express";
import jwt from "jsonwebtoken";
import { messages } from "@/config/messages";
import { expressAuthentication } from "@/middleware/tsoa.authentication";
import { UserType } from "@/utils/constants";

jest.mock("jsonwebtoken");
jest.mock("@/api/v1/users/infrastructure/persistence/models/UserModel", () => ({
	UserModel: { findOne: jest.fn() },
}));

// jwt.verify has void-returning overloads; cast to jest.Mock to mock return values
const jwtVerify = jest.mocked(jwt.verify) as jest.Mock;
const mockFindOne: jest.Mock = jest.requireMock(
	"@/api/v1/users/infrastructure/persistence/models/UserModel",
).UserModel.findOne;

function buildMockUser(overrides: Record<string, unknown> = {}) {
	return {
		id: "user-1",
		username: "testuser",
		type: UserType.NORMAL,
		allowRemote: true,
		allowVideoTranscoding: true,
		allowDownloads: true,
		hideInLogin: false,
		maxSessions: 0,
		...overrides,
	};
}

function buildRequest(overrides: Partial<Request> = {}): Request {
	return {
		cookies: {},
		headers: {},
		ip: "127.0.0.1",
		socket: {},
		params: {},
		body: {},
		...overrides,
	} as unknown as Request;
}

describe("expressAuthentication", () => {
	const OLD_ENV = process.env;

	beforeEach(() => {
		jest.clearAllMocks();
		process.env = { ...OLD_ENV, JWT_SECRET: "test-secret" };
	});

	afterAll(() => {
		process.env = OLD_ENV;
	});

	describe("public", () => {
		it("returns null without inspecting token", async () => {
			const result = await expressAuthentication(buildRequest(), "public");
			expect(result).toBeNull();
		});
	});

	describe("cookieAuth / bearerAuth", () => {
		it("throws UnauthorizedException when no token is present", async () => {
			await expect(
				expressAuthentication(buildRequest(), "cookieAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
				message: messages.errors.token.missing,
			});
		});

		it("throws UnauthorizedException when jwt.verify throws", async () => {
			const req = buildRequest({
				cookies: { token: "bad-token" },
			} as Partial<Request>);
			jwtVerify.mockImplementation(() => {
				throw new Error("invalid signature");
			});

			await expect(
				expressAuthentication(req, "cookieAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
			});
		});

		it("throws UnauthorizedException when user is not found", async () => {
			const req = buildRequest({
				cookies: { token: "valid-token" },
			} as Partial<Request>);
			jwtVerify.mockReturnValue({ userId: "user-1" });
			mockFindOne.mockResolvedValue(null);

			await expect(
				expressAuthentication(req, "cookieAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
			});
		});

		it("throws UnauthorizedException when user does not allow remote access", async () => {
			const req = buildRequest({
				cookies: { token: "valid-token" },
				ip: "203.0.113.1",
			} as Partial<Request>);
			jwtVerify.mockReturnValue({ userId: "user-1" });
			const user = buildMockUser({ allowRemote: false });
			mockFindOne.mockResolvedValue(user);

			// NOTE: the noRemoteAccess throw is inside the try block, so the catch
			// re-wraps it as messages.errors.token.invalid
			await expect(
				expressAuthentication(req, "cookieAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
				message: messages.errors.token.invalid,
			});
		});

		it("returns user when token and user are valid", async () => {
			const req = buildRequest({
				cookies: { token: "valid-token" },
			} as Partial<Request>);
			jwtVerify.mockReturnValue({ userId: "user-1" });
			const user = buildMockUser();
			mockFindOne.mockResolvedValue(user);

			const result = await expressAuthentication(req, "cookieAuth");
			expect(result).toEqual(user);
		});

		it("rejects malformed bearer authorization header", async () => {
			const req = buildRequest({
				headers: { authorization: "Basic abc" },
			} as unknown as Partial<Request>);

			await expect(
				expressAuthentication(req, "bearerAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
				message: messages.errors.token.missing,
			});
		});
	});

	describe("cookieAuthFast", () => {
		it("throws UnauthorizedException when no token", async () => {
			await expect(
				expressAuthentication(buildRequest(), "cookieAuthFast"),
			).rejects.toMatchObject({
				statusCode: 401,
				message: messages.errors.token.missing,
			});
		});

		it("returns user when token is valid", async () => {
			const req = buildRequest({
				cookies: { token: "valid-token" },
			} as Partial<Request>);
			jwtVerify.mockReturnValue({ userId: "user-1" });
			const user = buildMockUser();
			mockFindOne.mockResolvedValue(user);

			const result = await expressAuthentication(req, "cookieAuthFast");
			expect(result).toEqual(user);
		});

		it("throws invalid token when user is not found", async () => {
			const req = buildRequest({
				cookies: { token: "valid-token" },
			} as Partial<Request>);
			jwtVerify.mockReturnValue({ userId: "user-1" });
			mockFindOne.mockResolvedValue(null);

			await expect(
				expressAuthentication(req, "cookieAuthFast"),
			).rejects.toMatchObject({
				statusCode: 401,
				message: messages.errors.token.invalid,
			});
		});

		it("throws invalid token when jwt verification throws", async () => {
			const req = buildRequest({
				cookies: { token: "bad-token" },
			} as Partial<Request>);
			jwtVerify.mockImplementation(() => {
				throw new Error("bad token");
			});

			await expect(
				expressAuthentication(req, "cookieAuthFast"),
			).rejects.toMatchObject({
				statusCode: 401,
				message: messages.errors.token.invalid,
			});
		});
	});

	describe("adminAuth", () => {
		it("throws UnauthorizedException when no token", async () => {
			await expect(
				expressAuthentication(buildRequest(), "adminAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
			});
		});

		it("throws ForbiddenException when user is not admin", async () => {
			const req = buildRequest({
				cookies: { token: "valid-token" },
			} as Partial<Request>);
			jwtVerify.mockReturnValue({ userId: "user-1" });
			const user = buildMockUser({ type: UserType.NORMAL });
			mockFindOne.mockResolvedValue(user);

			await expect(
				expressAuthentication(req, "adminAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
			});
		});

		it("returns user when token is valid and user is admin", async () => {
			const req = buildRequest({
				cookies: { token: "valid-token" },
			} as Partial<Request>);
			jwtVerify.mockReturnValue({ userId: "admin-1" });
			const user = buildMockUser({ id: "admin-1", type: UserType.ADMIN });
			mockFindOne.mockResolvedValue(user);

			const result = await expressAuthentication(req, "adminAuth");
			expect(result).toEqual(user);
		});
	});

	describe("managementAuth", () => {
		it("returns null for local requests without a token", async () => {
			const req = buildRequest({
				ip: "127.0.0.1",
				cookies: {},
			} as Partial<Request>);
			const result = await expressAuthentication(req, "managementAuth");
			expect(result).toBeNull();
		});

		it("throws UnauthorizedException for remote requests without a token", async () => {
			const req = buildRequest({
				ip: "203.0.113.5",
				cookies: {},
				headers: {},
			} as Partial<Request>);

			await expect(
				expressAuthentication(req, "managementAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
				message: messages.errors.token.missing,
			});
		});

		it("returns local user when local request has a valid token", async () => {
			const req = buildRequest({
				ip: "127.0.0.1",
				headers: { authorization: "Bearer local-token" },
			} as unknown as Partial<Request>);
			jwtVerify.mockReturnValue({ userId: "user-1" });
			const user = buildMockUser();
			mockFindOne.mockResolvedValue(user);

			const result = await expressAuthentication(req, "managementAuth");
			expect(result).toEqual(user);
		});

		it("returns null for local request when JWT secret is missing", async () => {
			process.env = { ...process.env, JWT_SECRET: "" };
			const req = buildRequest({
				ip: "127.0.0.1",
				headers: { authorization: "Bearer local-token" },
			} as unknown as Partial<Request>);

			const result = await expressAuthentication(req, "managementAuth");
			expect(result).toBeNull();
		});

		it("rejects remote token when JWT secret is missing", async () => {
			process.env = { ...process.env, JWT_SECRET: "" };
			const req = buildRequest({
				ip: "203.0.113.10",
				headers: { authorization: "Bearer remote-token" },
			} as unknown as Partial<Request>);

			await expect(
				expressAuthentication(req, "managementAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
				message: messages.errors.token.invalid,
			});
		});

		it("rejects remote non-admin user even with valid token", async () => {
			const req = buildRequest({
				headers: {
					authorization: "Bearer remote-token",
					"x-forwarded-for": "203.0.113.11",
				},
			} as unknown as Partial<Request>);
			jwtVerify.mockReturnValue({ userId: "user-1" });
			mockFindOne.mockResolvedValue(buildMockUser({ type: UserType.NORMAL }));

			await expect(
				expressAuthentication(req, "managementAuth"),
			).rejects.toMatchObject({
				statusCode: 401,
				message: messages.errors.token.invalid,
			});
		});

		it("returns admin user for remote request with forwarded ip", async () => {
			const req = buildRequest({
				headers: {
					authorization: "Bearer remote-admin-token",
					"x-forwarded-for": "203.0.113.12, 10.0.0.1",
				},
			} as unknown as Partial<Request>);
			const user = buildMockUser({ id: "admin-1", type: UserType.ADMIN });
			jwtVerify.mockReturnValue({ userId: "admin-1" });
			mockFindOne.mockResolvedValue(user);

			const result = await expressAuthentication(req, "managementAuth");
			expect(result).toEqual(user);
		});
	});

	describe("unsupported security name", () => {
		it("throws an error for unknown security schemes", async () => {
			await expect(
				expressAuthentication(buildRequest(), "unknownScheme"),
			).rejects.toThrow("Unsupported authentication method");
		});
	});
});
