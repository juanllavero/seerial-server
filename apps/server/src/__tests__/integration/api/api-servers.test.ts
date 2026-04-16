import "reflect-metadata";
import type { Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { ServersRepositoryImpl } from "@/api/v1/servers/infrastructure/persistence/repositories/ServersRepositoryImpl";
import { GetAllUsersUseCase } from "@/api/v1/users/application/usecases/GetAllUsersUseCase";
import { UsersRepositoryImpl } from "@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl";
import { UserType } from "@/utils/constants";
import { createTestApp } from "../../helpers/app-factory";
import {
	clearAllTables,
	closeTestDataSource,
	getTestDataSource,
} from "../../helpers/test-db";

// Prevent p-limit and other ESM issues
jest.mock("@/api/v1/shared/infrastructure/adapters/di/container", () => ({
	useCases: {
		getAllUsers: jest.fn(),
		updateServer: jest.fn(),
	},
	fileSystemService: {
		getExternalPath: jest.fn().mockReturnValue("/test"),
		readJsonFile: jest.fn().mockReturnValue({}),
		writeJsonFile: jest.fn().mockResolvedValue(undefined),
	},
	tmdbApiClient: {
		THEMOVIEDB_API_TOKEN: "",
		getAPIKeyStatus: jest.fn().mockResolvedValue(false),
	},
}));

// Mock ServerConfigService static property to avoid initialization error
jest.mock(
	"@/api/v1/servers/infrastructure/services/ServerConfigService",
	() => ({
		ServerConfigService: {
			serverConfig: {
				id: "test-server-id",
				name: "Test Server",
				httpPort: 34200,
				httpsEnabled: false,
			},
			loadOrCreateServerConfig: jest.fn().mockResolvedValue(undefined),
			init: jest.fn().mockResolvedValue(undefined),
		},
	}),
);

const mockContainer = jest.requireMock(
	"@/api/v1/shared/infrastructure/adapters/di/container",
);

let app: Express;
let usersRepo: UsersRepositoryImpl;
let _serversRepo: ServersRepositoryImpl;
let adminToken: string;

beforeAll(async () => {
	process.env.JWT_SECRET = "test-api-secret-servers";
	await getTestDataSource();
	usersRepo = new UsersRepositoryImpl();
	_serversRepo = new ServersRepositoryImpl();
	app = createTestApp();
});

afterAll(async () => {
	await closeTestDataSource();
});

beforeEach(async () => {
	const ds = await getTestDataSource();
	await clearAllTables(ds);

	const admin = await usersRepo.create({
		username: "admin",
		password: "Admin123!",
		type: UserType.ADMIN,
	});
	adminToken = jwt.sign(
		{ userId: admin.id, type: admin.type },
		process.env.JWT_SECRET || "",
		{
			expiresIn: "1h",
		},
	);

	mockContainer.useCases.getAllUsers.mockReturnValue(
		new GetAllUsersUseCase(usersRepo),
	);
	mockContainer.useCases.updateServer.mockReturnValue({
		execute: jest.fn().mockResolvedValue({
			id: "test-server-id",
			name: "Updated Server",
			httpPort: 34200,
		}),
	});
});

describe("Servers API", () => {
	describe("GET /api/servers", () => {
		it("returns 200 without requiring auth", async () => {
			const res = await request(app).get("/api/servers");

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toHaveProperty("id", "test-server-id");
			expect(res.body.data).toHaveProperty("name", "Test Server");
		});

		it("returns users list in server status response", async () => {
			await usersRepo.create({ username: "user1", type: UserType.NORMAL });

			const res = await request(app).get("/api/servers");

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveProperty("users");
			expect(Array.isArray(res.body.data.users)).toBe(true);
		});

		it("returns INVALID_API_KEY status when no TMDB token is configured", async () => {
			const res = await request(app).get("/api/servers");

			expect(res.status).toBe(200);
			expect(res.body.data.status).toBe("INVALID_API_KEY");
		});
	});

	describe("PATCH /api/servers/:id", () => {
		it("returns 200 and updates the server with admin auth", async () => {
			const res = await request(app)
				.patch("/api/servers/test-server-id")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ name: "Updated Server" });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("returns 401 without auth token", async () => {
			const res = await request(app)
				.patch("/api/servers/test-server-id")
				.send({ name: "X" });

			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(res.body.success).toBe(false);
		});
	});
});
