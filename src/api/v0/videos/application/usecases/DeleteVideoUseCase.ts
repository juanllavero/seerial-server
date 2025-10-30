import { LibrariesRepositoryPort } from "@/api/v0/libraries/application/ports/LibrariesRepositoryPort";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { FilesManager } from "@/managers/FilesManager";
import { VideoRepositoryPort } from "../ports/VideosRepositoryPort";

export class DeleteVideoUseCase {
  constructor(
    private readonly videoRepository: VideoRepositoryPort,
    private readonly libraryRepository: LibrariesRepositoryPort
  ) {}

  async execute(videoId: string): Promise<void> {
    const video = await this.videoRepository.findById(videoId);
    if (!video) throw new ApiError(404, messages.errors.notFound.video);

    const library = await this.libraryRepository.getByVideoId(videoId);

    FilesManager.deleteDirectory(`resources/img/thumbnails/video/${videoId}`);
    FilesManager.deleteDirectory(
      `resources/img/thumbnails/chapters/${videoId}`
    );

    if (library) {
      await this.libraryRepository.removeAnalyzedFile(
        library.id,
        video.fileSrc
      );
    }

    await this.videoRepository.delete(videoId);
  }
}
