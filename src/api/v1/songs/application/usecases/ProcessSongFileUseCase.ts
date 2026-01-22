import { Album } from "@/api/v1/albums/domain/Album";
import { Collection } from "@/api/v1/collections/domain/Collection";
import { Library } from "@/api/v1/libraries/domain/Library";
import { FileSystemServicePort } from "@/api/v1/shared/application/ports/FileSystemServicePort";
import {
  notificationService,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { getAudioInfo } from "@/ffmpeg/audioInfo";
import logger from "@/utils/logger";
import { getFileName } from "@/utils/utils";
import fsPromises from "fs/promises";
import path from "path";
import { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

const songProcessingLogger = logger.child({ category: "Song Processing" });

export class ProcessSongFileUseCase {
  constructor(
    private readonly fileSystemService: FileSystemServicePort,
    private readonly songsRepo: SongsRepositoryPort
  ) {}

  async execute(
    rootFolder: string,
    library: Library,
    musicFile: string,
    collection: Collection,
    albumMap: Map<string, Album>
  ): Promise<void> {
    try {
      const metadata = await getAudioInfo(musicFile);
      if (!metadata) return;

      const {
        album,
        date,
        duration,
        genres,
        title,
        trackNumber,
        discNumber,
        codec,
        composers,
        artists,
      } = metadata;

      let newAlbum: Album | null = null;

      if (albumMap.has(album)) {
        newAlbum = albumMap.get(album)!;
      }

      if (!newAlbum) {
        newAlbum = await useCases.createAlbum().execute({
          title: album !== "" ? album : collection.title,
          year: date ? new Date(date).getFullYear().toString() : "",
          libraryId: library.id,
          folder: rootFolder,
          genres,
        });

        if (newAlbum) {
          albumMap.set(newAlbum.title, newAlbum);
        }

        // Update content in clients
        notificationService.mutateLibrary(library.id);
      }

      if (!newAlbum || !newAlbum.id) return;

      await useCases.addAlbumToCollection().execute(collection.id, newAlbum.id);

      const song = await useCases.createSong().execute({
        title: title !== "" ? title : getFileName(musicFile),
        albumId: newAlbum.id,
        trackNumber,
        discNumber,
        composers,
        artists,
        fileSrc: musicFile,
        duration: duration * 60,
      });

      for (const artist of artists) {
        const addArtistUseCase = useCases.addArtist();
        const newArtist = await addArtistUseCase.execute({
          name: artist,
        });

        if (newArtist && newArtist.id) {
          await useCases.addArtistToAlbum().execute(newArtist.id, newAlbum.id);
        }
      }

      if (newAlbum.coverSrc === "") {
        // Search for image in the same folder
        let imageSrc = await this.fileSystemService.findImageInFolder(
          path.dirname(musicFile)
        );

        // If no image is found in the same folder, search in the parent folder
        if (!imageSrc) {
          const parentFolder = path.resolve(path.dirname(musicFile), "..");
          imageSrc = await this.fileSystemService.findImageInFolder(
            parentFolder
          );
        }

        if (imageSrc) {
          await this.setEntityCover(newAlbum, "coverSrc", imageSrc);
          if (collection.musicPosterSrc === "") {
            await this.setEntityCover(collection, "musicPosterSrc", imageSrc);
          }
        }

        await useCases.updateAlbum().execute(newAlbum.id, newAlbum);

        // Update content in clients
        notificationService.mutateLibrary(library.id);
      }

      if (!song || !song.id) return;

      await useCases.addAnalyzedFile().execute(library.id, musicFile, song.id);

      // Save data in DB
      await useCases.updateLibrary().execute(library.id, library);
      await useCases.updateCollection().execute(collection.id, collection);
      await useCases.updateAlbum().execute(newAlbum.id, newAlbum);
      await useCases.updateSong().execute(song.id, song);
    } catch (error) {
      songProcessingLogger.error(error, "Error processing music file");
    }
  }

  /**
   * Helper function to handle cover art logic.
   * @param entity An object with an ID and a property to store the image path (e.g., Album or Collection)
   * @param propertyName The name of the property to update (e.g., 'coverSrc')
   * @param sourceImagePath The path of the image to copy.
   */
  async setEntityCover(
    entity: { id: string; [key: string]: any },
    propertyName: string,
    sourceImagePath: string
  ) {
    const imageName = path.basename(sourceImagePath);
    const destinationFolder = this.fileSystemService.getExternalPath(
      path.join("resources", "img", "posters", entity.id)
    );
    const destinationPath = path.join(destinationFolder, imageName);

    try {
      this.fileSystemService.createFolder(destinationFolder);
      await fsPromises.copyFile(sourceImagePath, destinationPath);

      entity[propertyName] = path
        .join("resources", "img", "posters", entity.id, imageName)
        .replace(/\\/g, "/");
    } catch (err) {
      songProcessingLogger.error(
        err,
        `Error copying image for entity ${entity.id}`
      );
    }
  }
}
