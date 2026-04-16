/** biome-ignore-all lint/style/noNonNullAssertion: <Test file> */

import "reflect-metadata";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { SeriesRepositoryImpl } from "@/api/v1/series/infrastructure/persistence/repositories/SeriesRepositoryImpl";
import { LibraryTypes } from "@/data/interfaces/Media";
import {
	clearAllTables,
	closeTestDataSource,
	getTestDataSource,
} from "../../helpers/test-db";

jest.mock("@/api/v1/shared/infrastructure/adapters/di/container", () => ({
	useCases: {},
	fileSystemService: { getExternalPath: jest.fn().mockReturnValue("/test") },
}));

let repo: SeriesRepositoryImpl;

beforeAll(async () => {
	await getTestDataSource();
	repo = new SeriesRepositoryImpl();
});

afterAll(async () => {
	await closeTestDataSource();
});

beforeEach(async () => {
	const ds = await getTestDataSource();
	await clearAllTables(ds);
});

async function createLibrary(name = "Shows Library") {
	return LibraryModel.save({
		id: `lib-${Math.random().toString(36).slice(2, 10)}`,
		name,
		type: LibraryTypes.SHOWS,
		language: "en",
		folders: [],
		order: 0,
		hidden: false,
	});
}

describe("SeriesRepositoryImpl", () => {
	describe("create / findById", () => {
		it("creates a series with a generated id", async () => {
			const library = await createLibrary();

			const series = await repo.create({
				libraryId: library.id,
				name: "Breaking Bad",
			});

			expect(series).not.toBeNull();
			expect(series.id).toBeTruthy();
			expect(series.name).toBe("Breaking Bad");
		});

		it("findById returns the series for a valid id", async () => {
			const library = await createLibrary();
			const created = await repo.create({
				libraryId: library.id,
				name: "The Wire",
			});

			const found = await repo.findById(created.id);

			expect(found).not.toBeNull();
			expect(found!.id).toBe(created.id);
		});

		it("findById returns null for a non-existent id", async () => {
			const found = await repo.findById("nonexistent");
			expect(found).toBeNull();
		});
	});

	describe("findAll", () => {
		it("returns an empty array when the library has no series", async () => {
			const library = await createLibrary();
			const result = await repo.findAll(library.id);
			expect(result).toEqual([]);
		});

		it("returns all series for a given library", async () => {
			const library = await createLibrary();
			await repo.create({ libraryId: library.id, name: "Show A" });
			await repo.create({ libraryId: library.id, name: "Show B" });

			const result = await repo.findAll(library.id);
			expect(result).toHaveLength(2);
		});

		it("does not return series from a different library", async () => {
			const lib1 = await createLibrary("Lib 1");
			const lib2 = await createLibrary("Lib 2");
			await repo.create({ libraryId: lib1.id, name: "Only Lib 1" });

			const result = await repo.findAll(lib2.id);
			expect(result).toHaveLength(0);
		});
	});

	describe("update", () => {
		it("updates series name", async () => {
			const library = await createLibrary();
			const series = await repo.create({
				libraryId: library.id,
				name: "Old Title",
			});

			const updated = await repo.update(series.id, { name: "New Title" });

			expect(updated.name).toBe("New Title");
		});

		it("throws for an empty id", async () => {
			await expect(repo.update("", { name: "x" })).rejects.toMatchObject({
				statusCode: 400,
			});
		});
	});

	describe("delete", () => {
		it("deletes the series so it can no longer be found", async () => {
			const library = await createLibrary();
			const series = await repo.create({
				libraryId: library.id,
				name: "To Delete",
			});

			await repo.delete(series.id);

			const found = await repo.findById(series.id);
			expect(found).toBeNull();
		});
	});
});
