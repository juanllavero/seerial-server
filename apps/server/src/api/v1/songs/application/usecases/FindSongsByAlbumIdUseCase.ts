import type { Song } from "../../domain/Song";
import type { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

export class FindSongsByAlbumIdUseCase {
	constructor(private songsRepo: SongsRepositoryPort) {}

	async execute(albumId: string): Promise<Song[]> {
		return this.songsRepo.findByAlbum(albumId);
	}
}
