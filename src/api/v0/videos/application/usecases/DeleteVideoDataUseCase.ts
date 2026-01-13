import { FileSystemServicePort } from "@/api/v0/shared/application/ports/FileSystemServicePort";
import { fileSystemService } from "@/api/v0/shared/infrastructure/adapters/di/container";

export class DeleteVideoDataUseCase {
  constructor(private readonly fileSystemService: FileSystemServicePort) {}

  async execute(videoId: string): Promise<void> {
    fileSystemService.deleteFolder(`resources/img/thumbnails/video/${videoId}`);
    fileSystemService.deleteFolder(
      `resources/img/thumbnails/chapters/${videoId}`
    );
  }
}
