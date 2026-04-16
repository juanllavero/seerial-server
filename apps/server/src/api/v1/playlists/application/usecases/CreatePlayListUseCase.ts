import type { PlayList } from "../../domain/PlayList";
import type { CreatePlayListDTO } from "../dtos/PlayListDTOs";
import type { PlayListRepositoryPort } from "../ports/PlayListRepositoryPort";

export class CreatePlayListUseCase {
	constructor(private playlistRepo: PlayListRepositoryPort) {}

	async execute(dto: CreatePlayListDTO): Promise<PlayList> {
		const playList: PlayList = {
			id: "", // Will be generated in repository
			title: dto.title,
			description: dto.description,
		};
		return this.playlistRepo.create(playList);
	}
}
