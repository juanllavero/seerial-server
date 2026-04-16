import type { Album } from "../../domain/Album";
import type { AlbumsRepositoryPort } from "../ports/AlbumsRepositoryPort";

export class FindAlbumByIdUseCase {
	constructor(private albumRepo: AlbumsRepositoryPort) {}

	async execute(id: string): Promise<Album | null> {
		return await this.albumRepo.findById(id);
	}
}
