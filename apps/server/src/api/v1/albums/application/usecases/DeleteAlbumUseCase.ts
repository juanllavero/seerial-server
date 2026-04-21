import { contentCleanupService } from "@/api/v1/shared/infrastructure/adapters/di/container";
import type { AlbumsRepositoryPort } from "../ports/AlbumsRepositoryPort";

export class DeleteAlbumUseCase {
	constructor(private albumRepo: AlbumsRepositoryPort) { }

	async execute(id: string): Promise<void> {
		contentCleanupService.cleanAlbum(id);
		await this.albumRepo.delete(id);
	}
}
