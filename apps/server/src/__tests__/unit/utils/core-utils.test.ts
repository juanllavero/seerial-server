import { ApiResponse } from "@/api/v1/shared/infrastructure/web/http/APIResponse";
import { messages } from "@/config/messages";
import { getUserId } from "@/utils/auth";

describe("getUserId", () => {
	it("returns user id when request is authenticated", () => {
		const req = {
			user: {
				id: "user-123",
			},
		};

		expect(getUserId(req as never)).toBe("user-123");
	});

	it("throws UnauthorizedException when request has no user id", () => {
		const req = {
			user: undefined,
		};

		expect(() => getUserId(req as never)).toThrow(
			messages.errors.token.missing,
		);
	});
});

describe("ApiResponse", () => {
	it("creates success responses with default message", () => {
		const response = ApiResponse.success({ id: "1" });

		expect(response.success).toBe(true);
		expect(response.message).toBe(messages.success.default);
		expect(response.data).toEqual({ id: "1" });
		expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
	});

	it("creates error responses with explicit message and null data by default", () => {
		const response = ApiResponse.error("Something failed");

		expect(response.success).toBe(false);
		expect(response.message).toBe("Something failed");
		expect(response.data).toBeNull();
	});
});

describe("LOCAL_DATA_PATH", () => {
	const originalPlatform = process.platform;

	const loadConstantsForPlatform = (platform: string) => {
		Object.defineProperty(process, "platform", {
			value: platform,
		});

		jest.resetModules();
		return require("@/utils/constants") as typeof import("@/utils/constants");
	};

	afterEach(() => {
		Object.defineProperty(process, "platform", {
			value: originalPlatform,
		});
		jest.resetModules();
	});

	it("uses Windows data directory convention", () => {
		const constants = loadConstantsForPlatform("win32");
		expect(constants.LOCAL_DATA_PATH).toContain("AppData\\Local");
	});

	it("uses macOS data directory convention", () => {
		const constants = loadConstantsForPlatform("darwin");
		expect(constants.LOCAL_DATA_PATH).toContain("Library");
		expect(constants.LOCAL_DATA_PATH).toContain("Application Support");
	});

	it("uses Linux data directory convention", () => {
		const constants = loadConstantsForPlatform("linux");
		expect(constants.LOCAL_DATA_PATH).toContain(".config");
	});

	it("falls back to app name when platform is unknown", () => {
		const constants = loadConstantsForPlatform("freebsd");
		expect(constants.LOCAL_DATA_PATH.endsWith(constants.APP_NAME)).toBe(true);
	});
});
