import type { FileSystemServicePort } from "@/api/v1/shared/application/ports/FileSystemServicePort";

export class DeleteVideoDataUseCase {
	constructor(private readonly fileSystemService: FileSystemServicePort) {}

	async execute(videoId: string): Promise<void> {
		this.fileSystemService.deleteFolder(
			`resources/img/thumbnails/video/${videoId}`,
		);
		this.fileSystemService.deleteFolder(
			`resources/img/thumbnails/chapters/${videoId}`,
		);
	}
}
