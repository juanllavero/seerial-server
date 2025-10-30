import { Library } from "@/api/v0/libraries/domain/Library";

export class ScanSongsUseCase {
  constructor(
    private readonly fileSystemService: IFileSystemService,
    private readonly movieRepository: IMovieRepository,
    private readonly processFolderUseCase: ProcessMovieFolderUseCase
  ) {}

  async execute(library: Library, root: string): Promise<void> {
    if (!(await this.fileSystemService.isFolder(root))) {
      // Single file
      if (!this.fileSystemService.isVideoFile(root)) return;
      await this.processFolderUseCase.execute(library, root, [root]);
      return;
    }

    // Folder logic
    const filesInDir = await this.fileSystemService.getFilesInFolder(root);
    const filesInRoot: string[] = [];
    const folders: string[] = [];

    for (const file of filesInDir) {
      const filePath = `${root}/${file.name}`;
      if (await this.fileSystemService.isFolder(filePath)) {
        folders.push(filePath);
      } else {
        if (this.fileSystemService.isVideoFile(filePath)) {
          filesInRoot.push(filePath);
        }
      }
    }

    // Rest of logic...
  }
}
