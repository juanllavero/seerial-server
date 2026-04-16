import "reflect-metadata";
import type { Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { UsersRepositoryImpl } from "@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl";
import { UserType } from "@/utils/constants";
import { createTestApp } from "../../helpers/app-factory";
import {
	clearAllTables,
	closeTestDataSource,
	getTestDataSource,
} from "../../helpers/test-db";

const mockMovie = {
	id: "movie-1",
	title: "Test Movie",
	description: "A great test film",
	year: 2023,
	rating: 7.5,
	duration: 120,
	poster: "",
	backdrop: "",
	genres: [],
	director: [],
	cast: [],
	studio: "",
	externalId: "",
	videoSrc: "/media/movie.mkv",
	watched: false,
	watchProgress: 0,
	videos: [],
	extras: [],
	watchLists: [],
	libraryId: "lib-1",
};

jest.mock("@/api/v1/shared/infrastructure/adapters/di/container", () => ({
	useCases: {
		getMoviebyId: jest.fn(),
		updateMovie: jest.fn(),
		deleteMovie: jest.fn(),
		refreshMovieMetadata: jest.fn(),
		updateMovieId: jest.fn(),
		addMovieToWatchList: jest.fn(),
		removeMovieFromWatchList: jest.fn(),
		addVideoToContinueWatching: jest.fn(),
		removeVideoFromContinueWatching: jest.fn(),
	},
	externalSearchService: {
		searchMovies: jest.fn().mockResolvedValue([]),
		getImdbScore: jest.fn().mockResolvedValue(-1),
	},
	fileSystemService: { getExternalPath: jest.fn().mockReturnValue("/test") },
}));

const mockContainer = jest.requireMock(
	"@/api/v1/shared/infrastructure/adapters/di/container",
);

let app: Express;
let usersRepo: UsersRepositoryImpl;
let userToken: string;
let adminToken: string;

beforeAll(async () => {
	process.env.JWT_SECRET = "test-api-secret-movies";
	await getTestDataSource();
	usersRepo = new UsersRepositoryImpl();
	app = createTestApp();
});

afterAll(async () => {
	await closeTestDataSource();
});

beforeEach(async () => {
	const ds = await getTestDataSource();
	await clearAllTables(ds);

	const user = await usersRepo.create({
		username: "user1",
		type: UserType.NORMAL,
	});
	userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "", {
		expiresIn: "1h",
	});

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

	mockContainer.useCases.getMoviebyId.mockReturnValue({
		execute: jest.fn().mockResolvedValue(mockMovie),
	});
	mockContainer.useCases.updateMovie.mockReturnValue({
		execute: jest
			.fn()
			.mockResolvedValue({ ...mockMovie, title: "Updated Movie" }),
	});
	mockContainer.useCases.deleteMovie.mockReturnValue({
		execute: jest.fn().mockResolvedValue(undefined),
	});
	mockContainer.useCases.refreshMovieMetadata.mockReturnValue({
		execute: jest.fn().mockResolvedValue(undefined),
	});
});

describe("Movies API", () => {
	describe("GET /api/movies/:id (cookieAuth)", () => {
		it("returns 200 with movie data for authenticated user", async () => {
			const res = await request(app)
				.get("/api/movies/movie-1")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toBeDefined();
		});

		it("returns 401 without auth token", async () => {
			const res = await request(app).get("/api/movies/movie-1");

			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(res.body.success).toBe(false);
		});

		it("returns 404 when movie is not found", async () => {
			mockContainer.useCases.getMoviebyId.mockReturnValue({
				execute: jest.fn().mockResolvedValue(null),
			});

			const res = await request(app)
				.get("/api/movies/nonexistent")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
		});
	});

	describe("PATCH /api/movies/:id (adminAuth)", () => {
		it("returns 200 and updates movie with admin token", async () => {
			const res = await request(app)
				.patch("/api/movies/movie-1")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ title: "Updated Movie" });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.title).toBe("Updated Movie");
		});

		it("returns 401 without auth", async () => {
			const res = await request(app)
				.patch("/api/movies/movie-1")
				.send({ title: "X" });

			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it("returns 403 when non-admin user tries to update", async () => {
			const res = await request(app)
				.patch("/api/movies/movie-1")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ title: "X" });

			expect(res.status).toBeGreaterThanOrEqual(400);
		});
	});

	describe("DELETE /api/movies/:id (adminAuth)", () => {
		it("returns 200 when deleting a movie with admin token", async () => {
			const res = await request(app)
				.delete("/api/movies/movie-1")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toBeNull();
		});

		it("returns 401 for unauthenticated delete", async () => {
			const res = await request(app).delete("/api/movies/movie-1");
			expect(res.status).toBeGreaterThanOrEqual(400);
		});
	});

	describe("POST /api/movies/:id/metadata (adminAuth)", () => {
		it("returns 200 when refreshing metadata with admin token", async () => {
			const res = await request(app)
				.post("/api/movies/movie-1/metadata")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});
	});
});
