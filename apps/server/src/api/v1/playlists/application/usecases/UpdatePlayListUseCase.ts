import type { PlayList } from "../../domain/PlayList";
import type { UpdatePlayListDTO } from "../dtos/PlayListDTOs";
import type { PlayListRepositoryPort } from "../ports/PlayListRepositoryPort";

export class UpdatePlayListUseCase {
	constructor(private playlistRepo: PlayListRepositoryPort) {}

	async execute(id: string, data: UpdatePlayListDTO): Promise<PlayList> {
		return this.playlistRepo.update(id, data);
	}
}
