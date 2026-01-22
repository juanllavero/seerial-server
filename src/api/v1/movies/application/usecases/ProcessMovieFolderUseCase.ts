import { FileSystemServicePort } from "@/api/v1/shared/application/ports/FileSystemServicePort";

export class ProcessMovieFolderUseCase {
  constructor(private readonly fileSystemService: FileSystemServicePort) {}

  async execute(): Promise<void> {}
}
