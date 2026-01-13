import { Library } from "@/api/v0/libraries/domain/Library";
import { FileSystemServicePort } from "@/api/v0/shared/application/ports/FileSystemServicePort";
import {
  notificationService,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { getFileName } from "@/utils/utils";

export class ScanSongsUseCase {
  constructor(private readonly fileSystemService: FileSystemServicePort) {}

  async execute(library: Library, root: string): Promise<void> {
    if (!(await this.fileSystemService.isFolder(root))) return;

    // Add collection or retrieve existing one
    const collection = await useCases.addCollection().execute({
      title: getFileName(root),
    });

    if (!collection) return;
    await useCases.addLibraryToCollection().execute(library.id, collection.id);

    // Get music files inside folder (4 folders of depth)
    const musicFiles = await this.fileSystemService.getValidMusicFiles(root);

    // Cache albums to avoid heap overflow
    const allAlbums = (await useCases.getAlbums().execute(library.id)) || [];
    const albumMap = new Map(allAlbums.map((album) => [album.title, album]));

    //Process each file
    for (const file of musicFiles) {
      if (!library.analyzedFiles[file]) {
        await useCases
          .processSongFile()
          .execute(root, library, file, collection, albumMap);
      }
    }

    // Update content in clients
    notificationService.mutateLibrary(library.id);
  }
}
