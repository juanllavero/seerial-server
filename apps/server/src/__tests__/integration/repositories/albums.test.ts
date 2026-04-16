/** biome-ignore-all lint/style/noNonNullAssertion: <Test file> */

import "reflect-metadata";
import { AlbumArtistModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumArtistModel";
import { AlbumsRepositoryImpl } from "@/api/v1/albums/infrastructure/persistence/repositories/AlbumsRepositoryImpl";
import { ArtistModel } from "@/api/v1/artists/infrastructure/persistence/models/ArtistModel";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
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

let repo: AlbumsRepositoryImpl;

beforeAll(async () => {
	await getTestDataSource();
	repo = new AlbumsRepositoryImpl();
});

afterAll(async () => {
	await closeTestDataSource();
});

beforeEach(async () => {
	const ds = await getTestDataSource();
	await clearAllTables(ds);
});

async function createLibrary() {
	return LibraryModel.save({
		id: `lib-${Math.random().toString(36).slice(2, 10)}`,
		name: "Music Library",
		type: LibraryTypes.MUSIC,
		language: "en",
		folders: [],
		order: 0,
		hidden: false,
	});
}

describe("AlbumsRepositoryImpl", () => {
	it("creates and gets album by id", async () => {
		const library = await createLibrary();

		const created = await repo.create({
			libraryId: library.id,
			title: "Album 1",
			folder: "/music/album-1",
		});

		const found = await repo.findById(created.id);
		expect(found).not.toBeNull();
		expect(found!.title).toBe("Album 1");
	});

	it("findAll returns albums for a library", async () => {
		const library = await createLibrary();
		await repo.create({
			libraryId: library.id,
			title: "A",
			folder: "/music/a",
		});
		await repo.create({
			libraryId: library.id,
			title: "B",
			folder: "/music/b",
		});

		const albums = await repo.findAll(library.id);
		expect(albums.length).toBe(2);
	});

	it("updates and deletes an album", async () => {
		const library = await createLibrary();
		const created = await repo.create({
			libraryId: library.id,
			title: "Temp",
			folder: "/music/temp",
		});

		const updated = await repo.update(created.id, { title: "Updated Album" });
		expect(updated.title).toBe("Updated Album");

		await repo.delete(created.id);
		await expect(repo.findById(created.id)).resolves.toBeNull();
	});

	it("adds and removes artist relationships for an album", async () => {
		const library = await createLibrary();
		const album = await repo.create({
			libraryId: library.id,
			title: "Album With Artist",
			folder: "/music/album-with-artist",
		});
		const artist = await ArtistModel.save({
			id: `art-${Math.random().toString(36).slice(2, 10)}`,
			name: "Artist 1",
		});

		const relation = await repo.addArtistToAlbum(artist.id, album.id);

		expect(relation.artistId).toBe(artist.id);
		expect(relation.albumId).toBe(album.id);
		expect(
			await AlbumArtistModel.findOne({
				where: { artistId: artist.id, albumId: album.id },
			}),
		).not.toBeNull();

		await repo.removeArtistFromAlbum(artist.id, album.id);

		expect(
			await AlbumArtistModel.findOne({
				where: { artistId: artist.id, albumId: album.id },
			}),
		).toBeNull();
	});
});
