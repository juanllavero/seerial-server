import type { PlayList } from "../../domain/PlayList";
import type { PlayListRepositoryPort } from "../ports/PlayListRepositoryPort";

export class FindAllPlayListsUseCase {
	constructor(private playlistRepo: PlayListRepositoryPort) {}

	async execute(): Promise<PlayList[]> {
		return this.playlistRepo.findAll();
	}
}
