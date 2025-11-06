import { Album } from "@/api/v0/albums/domain/Album";
import { addArtist } from "@/api/v0/artists/artists.service";
import { Collection } from "@/api/v0/collections/domain/Collection";
import { Library } from "@/api/v0/libraries/domain/Library";
import { FileSystemServicePort } from "@/api/v0/shared/application/ports/FileSystemServicePort";
import {
  notificationService,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { getAudioInfo } from "@/ffmpeg/audioInfo";
import { setEntityCover } from "@/file-search/utils/utils";
import { getFileName } from "@/utils/utils";
import path from "path";
import { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

export class ProcessSongFileUseCase {
  private readonly createAlbum = useCases.createAlbum();
  private readonly addAlbumToCollection = useCases.addAlbumToCollection();
  private readonly addArtistToAlbum = useCases.addArtistToAlbum();
  private readonly addAnalyzedFile = useCases.addAnalyzedFile();
  private readonly updateLibrary = useCases.updateLibrary();
  private readonly updateCollection = useCases.updateCollection();
  private readonly updateAlbum = useCases.updateAlbum();
  private readonly updateSong = useCases.updateSong();
  private readonly addSong = useCases.createSong();

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
        newAlbum = await this.createAlbum.execute({
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

      await this.addAlbumToCollection.execute(collection.id, newAlbum.id);

      const song = await this.addSong.execute({
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
        const newArtist = await addArtist({
          name: artist,
        });

        if (newArtist && newArtist.id) {
          await this.addArtistToAlbum.execute(newArtist.id, newAlbum.id);
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
          await setEntityCover(newAlbum, "coverSrc", imageSrc);
          if (collection.musicPosterSrc === "") {
            await setEntityCover(collection, "musicPosterSrc", imageSrc);
          }
        }

        await this.updateAlbum.execute(newAlbum.id, newAlbum);

        // Update content in clients
        notificationService.mutateLibrary(library.id);
      }

      if (!song || !song.id) return;

      await this.addAnalyzedFile.execute(library.id, musicFile, song.id);

      // Save data in DB
      await this.updateLibrary.execute(library.id, library);
      await this.updateCollection.execute(collection.id, collection);
      await this.updateAlbum.execute(newAlbum.id, newAlbum);
      await this.updateSong.execute(song.id, song);
    } catch (error) {
      console.error("Error processing music file", error);
    }
  }
}
