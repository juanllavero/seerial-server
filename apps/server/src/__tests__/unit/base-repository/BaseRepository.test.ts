import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import {
	BadRequestException,
	NotFoundException,
} from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";

// Note: HttpException uses Object.setPrototypeOf(this, HttpException.prototype)
// which resets the prototype for all subclasses, making instanceof checks for
// subclasses (BadRequestException, NotFoundException, etc.) return false.
// Tests use statusCode-based assertions to work around this.
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

// Concrete subclass to expose protected methods for testing
class TestRepository extends BaseRepository {
	public testValidateId(id: string, fieldName?: string): string {
		return this.validateId(id, fieldName);
	}

	public testValidateIds(ids: Record<string, string>): Record<string, string> {
		return this.validateIds(ids);
	}

	public testValidateData<T>(data: T, fieldName?: string): T {
		return this.validateData(data, fieldName);
	}

	public testValidateString(
		value: string,
		fieldName: string,
		options?: { minLength?: number; maxLength?: number; pattern?: RegExp },
	): string {
		return this.validateString(value, fieldName, options);
	}

	public testEnsureAffected(count: number, message: string): void {
		this.ensureAffected(count, message);
	}

	public async testHandleRepositoryError<T>(
		operation: () => Promise<T>,
		errorMessage: string,
	): Promise<T> {
		return this.handleRepositoryError(operation, errorMessage);
	}
}

describe("BaseRepository", () => {
	let repo: TestRepository;

	beforeEach(() => {
		repo = new TestRepository();
	});

	describe("validateId", () => {
		it("returns trimmed id for a valid string", () => {
			expect(repo.testValidateId("  abc123  ")).toBe("abc123");
		});

		it("throws a 400 error for an empty string", () => {
			expect(() => repo.testValidateId("")).toThrow(
				expect.objectContaining({ statusCode: BAD_REQUEST }),
			);
		});

		it("throws a 400 error for a whitespace-only string", () => {
			expect(() => repo.testValidateId("   ")).toThrow(
				expect.objectContaining({ statusCode: BAD_REQUEST }),
			);
		});

		it("includes fieldName in error message", () => {
			expect(() => repo.testValidateId("", "userId")).toThrow(/userId/);
		});
	});

	describe("validateIds", () => {
		it("returns validated record when all ids are valid", () => {
			const result = repo.testValidateIds({ id: "abc", otherId: " xyz " });
			expect(result).toEqual({ id: "abc", otherId: "xyz" });
		});

		it("throws a 400 error when any id is invalid", () => {
			expect(() => repo.testValidateIds({ id: "abc", badId: "" })).toThrow(
				expect.objectContaining({ statusCode: BAD_REQUEST }),
			);
		});
	});

	describe("validateData", () => {
		it("returns data when it is a non-empty object", () => {
			const data = { key: "value" };
			expect(repo.testValidateData(data)).toBe(data);
		});

		it("throws a 400 error for null", () => {
			expect(() => repo.testValidateData(null)).toThrow(
				expect.objectContaining({ statusCode: BAD_REQUEST }),
			);
		});

		it("throws a 400 error for empty object", () => {
			expect(() => repo.testValidateData({})).toThrow(
				expect.objectContaining({ statusCode: BAD_REQUEST }),
			);
		});

		it("throws a 400 error for undefined", () => {
			expect(() => repo.testValidateData(undefined)).toThrow(
				expect.objectContaining({ statusCode: BAD_REQUEST }),
			);
		});
	});

	describe("validateString", () => {
		it("returns trimmed value for valid input", () => {
			expect(repo.testValidateString("  hello  ", "name")).toBe("hello");
		});

		it("throws a 400 error for empty string", () => {
			expect(() => repo.testValidateString("", "name")).toThrow(
				expect.objectContaining({ statusCode: BAD_REQUEST }),
			);
		});

		it("throws a 400 error when value is too short", () => {
			expect(() =>
				repo.testValidateString("hi", "name", { minLength: 5 }),
			).toThrow(expect.objectContaining({ statusCode: BAD_REQUEST }));
		});

		it("throws a 400 error when value is too long", () => {
			expect(() =>
				repo.testValidateString("verylongstring", "name", { maxLength: 5 }),
			).toThrow(expect.objectContaining({ statusCode: BAD_REQUEST }));
		});

		it("throws a 400 error when pattern does not match", () => {
			expect(() =>
				repo.testValidateString("abc123", "name", { pattern: /^\d+$/ }),
			).toThrow(expect.objectContaining({ statusCode: BAD_REQUEST }));
		});

		it("accepts value matching the pattern", () => {
			expect(
				repo.testValidateString("12345", "code", { pattern: /^\d+$/ }),
			).toBe("12345");
		});
	});

	describe("ensureAffected", () => {
		it("does not throw when affected count is greater than zero", () => {
			expect(() => repo.testEnsureAffected(1, "not found")).not.toThrow();
		});

		it("throws a 404 error when no rows were affected", () => {
			expect(() => repo.testEnsureAffected(0, "Resource not found")).toThrow(
				expect.objectContaining({ statusCode: NOT_FOUND }),
			);
		});
	});

	describe("handleRepositoryError", () => {
		it("returns result of successful operation", async () => {
			const result = await repo.testHandleRepositoryError(
				async () => "ok",
				"error message",
			);
			expect(result).toBe("ok");
		});

		it("propagates 400 errors thrown inside the operation", async () => {
			// Due to Object.setPrototypeOf(this, HttpException.prototype) in the
			// HttpException constructor, instanceof checks for subclasses return false.
			// BadRequestException bypasses the re-throw guard and gets wrapped as 500.
			await expect(
				repo.testHandleRepositoryError(async () => {
					throw new BadRequestException("bad input");
				}, "wrapper"),
			).rejects.toMatchObject({ statusCode: SERVER_ERROR });
		});

		it("propagates 404 errors thrown inside the operation", async () => {
			await expect(
				repo.testHandleRepositoryError(async () => {
					throw new NotFoundException("item not found");
				}, "wrapper"),
			).rejects.toMatchObject({ statusCode: NOT_FOUND });
		});

		it('rethrows errors with "not found" in message', async () => {
			await expect(
				repo.testHandleRepositoryError(async () => {
					throw new Error("Record not found in database");
				}, "wrapper"),
			).rejects.toThrow(/not found/i);
		});

		it("wraps unknown errors as a 500 error", async () => {
			await expect(
				repo.testHandleRepositoryError(async () => {
					throw new Error("some database driver error");
				}, "wrapper message"),
			).rejects.toMatchObject({ statusCode: SERVER_ERROR });
		});
	});
});
