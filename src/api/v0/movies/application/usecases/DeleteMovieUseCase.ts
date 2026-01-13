import { LibrariesRepositoryPort } from "@/api/v0/libraries/application/ports/LibrariesRepositoryPort";
import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MoviesRepositoryPort } from "../ports/MoviesRepositoryPort";

export class DeleteMovieUseCase {
  constructor(
    private libraryRepository: LibrariesRepositoryPort,
    private moviesRepo: MoviesRepositoryPort
  ) {}

  async execute(id: string): Promise<void> {
    const movie = await this.moviesRepo.findById(id);

    if (!movie) {
      throw new ApiError(404, messages.errors.notFound.movie);
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
        movie.folder
      );
    }

    await this.moviesRepo.delete(id);
  }
}
