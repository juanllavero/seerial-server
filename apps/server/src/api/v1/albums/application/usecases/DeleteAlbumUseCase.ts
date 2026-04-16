import type { AlbumsRepositoryPort } from "../ports/AlbumsRepositoryPort";

export class DeleteAlbumUseCase {
	constructor(private albumRepo: AlbumsRepositoryPort) {}

	async execute(id: string): Promise<void> {
		await this.albumRepo.delete(id);
	}
}
