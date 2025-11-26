import { LibrariesRepositoryPort } from "@/api/v0/libraries/application/ports/LibrariesRepositoryPort";
import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { VideoRepositoryPort } from "../ports/VideosRepositoryPort";

export class DeleteVideoUseCase {
  private deleteVideoData = useCases.deleteVideoData();

  constructor(
    private readonly videoRepository: VideoRepositoryPort,
    private readonly libraryRepository: LibrariesRepositoryPort
  ) {}

  async execute(videoId: string): Promise<void> {
    const video = await this.videoRepository.findById(videoId);
    if (!video) throw new ApiError(404, messages.errors.notFound.video);

    // Delete local media files and folders
    await this.deleteVideoData.execute(videoId);

    const library = await this.libraryRepository.getByVideoId(videoId);

    if (library) {
      await this.libraryRepository.removeAnalyzedFile(
        library.id,
        video.fileSrc
      );
    }

    await this.videoRepository.delete(videoId);
  }
}
