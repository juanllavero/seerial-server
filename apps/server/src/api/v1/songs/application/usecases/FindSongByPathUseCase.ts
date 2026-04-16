import type { Song } from "../../domain/Song";
import type { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

export class FindSongByPathUseCase {
	constructor(private songsRepo: SongsRepositoryPort) {}

	async execute(path: string): Promise<Song | null> {
		return this.songsRepo.findByPath(path);
	}
}
