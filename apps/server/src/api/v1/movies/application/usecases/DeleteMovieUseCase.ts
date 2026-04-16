import type { LibrariesRepositoryPort } from "@/api/v1/libraries/application/ports/LibrariesRepositoryPort";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { NotFoundException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { messages } from "@/config/messages";
import type { MoviesRepositoryPort } from "../ports/MoviesRepositoryPort";

export class DeleteMovieUseCase {
	constructor(
		private libraryRepository: LibrariesRepositoryPort,
		private moviesRepo: MoviesRepositoryPort,
	) {}

	async execute(id: string): Promise<void> {
		const movie = await this.moviesRepo.findById(id);

		if (!movie) {
			throw new NotFoundException(messages.errors.notFound.movie);
		}

		for (const video of movie.videos) {
			await useCases.deleteVideo().execute(video.id);
		}

		const library = await this.libraryRepository.getById(movie.libraryId);

		// Delete local media files and folders
		await useCases.deleteMovieData().execute(id);

		if (library) {
			await this.libraryRepository.removeAnalyzedFolder(
				library.id,
				movie.folder,
			);
		}

		await this.moviesRepo.delete(id);
	}
}
