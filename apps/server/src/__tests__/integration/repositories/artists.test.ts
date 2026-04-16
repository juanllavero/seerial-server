/** biome-ignore-all lint/style/noNonNullAssertion: <Test file> */

import "reflect-metadata";
import { ArtistsRepositoryImpl } from "@/api/v1/artists/infrastructure/persistence/repositories/ArtistsRepositoryImpl";
import {
	clearAllTables,
	closeTestDataSource,
	getTestDataSource,
} from "../../helpers/test-db";

jest.mock("@/api/v1/shared/infrastructure/adapters/di/container", () => ({
	useCases: {},
	fileSystemService: { getExternalPath: jest.fn().mockReturnValue("/test") },
}));

let repo: ArtistsRepositoryImpl;

beforeAll(async () => {
	await getTestDataSource();
	repo = new ArtistsRepositoryImpl();
});

afterAll(async () => {
	await closeTestDataSource();
});

beforeEach(async () => {
	const ds = await getTestDataSource();
	await clearAllTables(ds);
});

describe("ArtistsRepositoryImpl", () => {
	it("adds and fetches an artist by name", async () => {
		const created = await repo.add({ name: "Hans Zimmer" });
		const found = await repo.getByName("Hans Zimmer");

		expect(created.id).toBeTruthy();
		expect(found).not.toBeNull();
		expect(found!.name).toBe("Hans Zimmer");
	});

	it("returns existing artist when adding duplicate name", async () => {
		const first = await repo.add({ name: "John Williams" });
		const second = await repo.add({ name: "John Williams" });

		expect(first.id).toBe(second.id);
	});

	it("updates and deletes an artist", async () => {
		const created = await repo.add({ name: "Temp Artist" });
		const updated = await repo.update(created.id, { name: "Updated Artist" });

		expect(updated.name).toBe("Updated Artist");

		const deleted = await repo.delete(created.id);
		expect(deleted).toBe(true);
		await expect(repo.getByName("Updated Artist")).resolves.toBeNull();
	});
});
