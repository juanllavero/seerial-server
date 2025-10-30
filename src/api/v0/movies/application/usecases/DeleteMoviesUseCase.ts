import { LibrariesRepositoryPort } from "@/api/v0/libraries/application/ports/LibrariesRepositoryPort";
import { VideoRepositoryPort } from "@/api/v0/videos/application/ports/VideosRepositoryPort";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { FilesManager } from "@/managers/FilesManager";
import { MoviesRepositoryPort } from "../ports/MoviesRepositoryPort";

export class DeleteMovieUseCase {
  constructor(
    private libraryRepository: LibrariesRepositoryPort,
    private moviesRepo: MoviesRepositoryPort,
    private videosRepo: VideoRepositoryPort
  ) {}

  async execute(id: string): Promise<void> {
    const movie = await this.moviesRepo.findById(id);

    if (!movie) {
      throw new ApiError(404, messages.errors.notFound.movie);
    }

    for (const video of movie.videos) {
      await this.videosRepo.delete(video.id);
    }

    const library = await this.libraryRepository.getById(movie.libraryId);

    FilesManager.deleteDirectory(`resources/img/backgrounds/${movie.id}`);
    FilesManager.deleteDirectory(`resources/img/posters/${movie.id}`);
    FilesManager.deleteDirectory(`resources/img/logos/${movie.id}`);

    if (library) {
      await this.libraryRepository.removeAnalyzedFolder(
        library.id,
        movie.folder
      );
    }

    await this.moviesRepo.delete(id);
  }
}
