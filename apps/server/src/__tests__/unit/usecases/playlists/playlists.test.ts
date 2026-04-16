import type { PlayListRepositoryPort } from "@/api/v1/playlists/application/ports/PlayListRepositoryPort";
import { AddSongToPlayListUseCase } from "@/api/v1/playlists/application/usecases/AddSongToPlayListUseCase";
import { CreatePlayListUseCase } from "@/api/v1/playlists/application/usecases/CreatePlayListUseCase";
import { DeletePlayListUseCase } from "@/api/v1/playlists/application/usecases/DeletePlayListUseCase";
import { FindAllPlayListsUseCase } from "@/api/v1/playlists/application/usecases/FindAllPlayListsUseCase";
import { FindPlayListByIdUseCase } from "@/api/v1/playlists/application/usecases/FindPlayListByIdUseCase";
import { RemoveSongFromPlayListUseCase } from "@/api/v1/playlists/application/usecases/RemoveSongFromPlayListUseCase";
import { UpdatePlayListUseCase } from "@/api/v1/playlists/application/usecases/UpdatePlayListUseCase";
import type { PlayList } from "@/api/v1/playlists/domain/PlayList";

function buildPlayList(overrides: Partial<PlayList> = {}): PlayList {
	return {
		id: "playlist-1",
		title: "Road Trip",
		description: "Driving songs",
		...overrides,
	} as PlayList;
}

function buildPlayListRepo(
	overrides: Partial<PlayListRepositoryPort> = {},
): PlayListRepositoryPort {
	return {
		findAll: jest.fn(),
		findById: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		addSongToPlaylist: jest.fn(),
		removeSongFromPlaylist: jest.fn(),
		...overrides,
	};
}

describe("Playlist use cases", () => {
	describe("CreatePlayListUseCase", () => {
		it("builds a new playlist DTO and creates it through the repository", async () => {
			const playList = buildPlayList();
			const repo = buildPlayListRepo({
				create: jest.fn().mockResolvedValue(playList),
			});

			const result = await new CreatePlayListUseCase(repo).execute({
				title: "Road Trip",
				description: "Driving songs",
			});

			expect(result).toEqual(playList);
			expect(repo.create).toHaveBeenCalledWith({
				id: "",
				title: "Road Trip",
				description: "Driving songs",
			});
		});
	});

	describe("FindAllPlayListsUseCase", () => {
		it("returns all playlists from the repository", async () => {
			const playLists = [
				buildPlayList(),
				buildPlayList({ id: "playlist-2", title: "Sleep" }),
			];
			const repo = buildPlayListRepo({
				findAll: jest.fn().mockResolvedValue(playLists),
			});

			const result = await new FindAllPlayListsUseCase(repo).execute();

			expect(result).toEqual(playLists);
			expect(repo.findAll).toHaveBeenCalledTimes(1);
		});
	});

	describe("FindPlayListByIdUseCase", () => {
		it("returns a playlist by id", async () => {
			const playList = buildPlayList();
			const repo = buildPlayListRepo({
				findById: jest.fn().mockResolvedValue(playList),
			});

			const result = await new FindPlayListByIdUseCase(repo).execute(
				playList.id,
			);

			expect(result).toEqual(playList);
			expect(repo.findById).toHaveBeenCalledWith(playList.id);
		});

		it("returns null when the playlist does not exist", async () => {
			const repo = buildPlayListRepo({
				findById: jest.fn().mockResolvedValue(null),
			});

			await expect(
				new FindPlayListByIdUseCase(repo).execute("missing"),
			).resolves.toBeNull();
		});
	});

	describe("UpdatePlayListUseCase", () => {
		it("updates the playlist through the repository", async () => {
			const updatedPlayList = buildPlayList({ title: "Updated Road Trip" });
			const repo = buildPlayListRepo({
				update: jest.fn().mockResolvedValue(updatedPlayList),
			});

			const result = await new UpdatePlayListUseCase(repo).execute(
				"playlist-1",
				{
					title: "Updated Road Trip",
				},
			);

			expect(result).toEqual(updatedPlayList);
			expect(repo.update).toHaveBeenCalledWith("playlist-1", {
				title: "Updated Road Trip",
			});
		});
	});

	describe("DeletePlayListUseCase", () => {
		it("deletes the playlist through the repository", async () => {
			const repo = buildPlayListRepo({
				delete: jest.fn().mockResolvedValue(undefined),
			});

			await expect(
				new DeletePlayListUseCase(repo).execute("playlist-1"),
			).resolves.toBeUndefined();
			expect(repo.delete).toHaveBeenCalledWith("playlist-1");
		});
	});

	describe("AddSongToPlayListUseCase", () => {
		it("adds a song to the playlist", async () => {
			const repo = buildPlayListRepo({
				addSongToPlaylist: jest.fn().mockResolvedValue(undefined),
			});

			await new AddSongToPlayListUseCase(repo).execute("playlist-1", "song-1");

			expect(repo.addSongToPlaylist).toHaveBeenCalledWith(
				"playlist-1",
				"song-1",
			);
		});
	});

	describe("RemoveSongFromPlayListUseCase", () => {
		it("removes a song from the playlist", async () => {
			const repo = buildPlayListRepo({
				removeSongFromPlaylist: jest.fn().mockResolvedValue(undefined),
			});

			await new RemoveSongFromPlayListUseCase(repo).execute(
				"playlist-1",
				"song-1",
			);

			expect(repo.removeSongFromPlaylist).toHaveBeenCalledWith(
				"playlist-1",
				"song-1",
			);
		});
	});
});
