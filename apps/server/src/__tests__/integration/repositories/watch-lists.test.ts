/** biome-ignore-all lint/style/noNonNullAssertion: <Test file> */

import "reflect-metadata";
import { WatchListRepositoryImpl } from "@/api/v1/watch-lists/infrastructure/persistence/repositories/WatchListRepositoryImpl";
import {
	clearAllTables,
	closeTestDataSource,
	getTestDataSource,
} from "../../helpers/test-db";

// WatchListRepository imports container; keep a minimal mock to avoid side effects.
jest.mock("@/api/v1/shared/infrastructure/adapters/di/container", () => ({
	librariesRepo: {},
	useCases: {},
	fileSystemService: { getExternalPath: jest.fn().mockReturnValue("/test") },
}));

let repo: WatchListRepositoryImpl;

beforeAll(async () => {
	await getTestDataSource();
	repo = new WatchListRepositoryImpl();
});

afterAll(async () => {
	await closeTestDataSource();
});

beforeEach(async () => {
	const ds = await getTestDataSource();
	await clearAllTables(ds);
});

describe("WatchListRepositoryImpl", () => {
	it("creates and finds a watch-list item by id", async () => {
		const created = await repo.create({
			userId: "user-1",
			watched: false,
			timeWatched: 0,
		} as never);

		const found = await repo.findById(created.id);
		expect(created.id).toBeTruthy();
		expect(found).not.toBeNull();
		expect(found!.userId).toBe("user-1");
	});

	it("returns existing item on duplicate create for same unique keys", async () => {
		const first = await repo.create({ userId: "user-1" } as never);
		const second = await repo.create({ userId: "user-1" } as never);

		expect(first.id).toBe(second.id);
	});

	it("updates and deletes watch-list item", async () => {
		const created = await repo.create({
			userId: "user-1",
			watched: false,
		} as never);

		const updated = await repo.update(created.id, {
			watched: true,
			timeWatched: 120,
		});
		expect(updated.watched).toBe(true);
		expect(updated.timeWatched).toBe(120);

		await repo.delete(created.id);
		await expect(repo.findById(created.id)).resolves.toBeNull();
	});
});
