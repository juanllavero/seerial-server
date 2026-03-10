import fsPromises from 'node:fs/promises';
import path from 'node:path';
import type { AlbumsRepositoryPort } from '@/api/v1/albums/application/ports/AlbumsRepositoryPort';
import type { Album } from '@/api/v1/albums/domain/Album';
import type { ArtistsRepositoryPort } from '@/api/v1/artists/application/ports/ArtistsRepositoryPort';
import type { CollectionsRepositoryPort } from '@/api/v1/collections/application/ports/CollectionsRepositoryPort';
import type { Collection } from '@/api/v1/collections/domain/Collection';
import type { LibrariesRepositoryPort } from '@/api/v1/libraries/application/ports/LibrariesRepositoryPort';
import type { Library } from '@/api/v1/libraries/domain/Library';
import type { FileSystemServicePort } from '@/api/v1/shared/application/ports/FileSystemServicePort';
import type { NotificationServicePort } from '@/api/v1/shared/application/ports/NotificationServicePort';
import { getAudioInfo } from '@/api/v1/shared/infrastructure/adapters/ffmpeg/audioInfo';
import { MusicBrainzService } from '@/api/v1/shared/infrastructure/services/MusicBrainzService';
import { WriteQueue } from '@/api/v1/shared/infrastructure/services/WriteQueue';
import type { SongsRepositoryPort } from '@/api/v1/songs/application/ports/SongsRepositoryPort';
import logger from '@/utils/logger';
import { getFileName } from '@/utils/utils';

const musicLogger = logger.child({ category: 'Music Scan' });

interface AlbumFolder {
  path: string;
  musicFiles: string[];
}

export class ScanMusicUseCase {
  private readonly writeQueue = new WriteQueue();
  private readonly musicBrainz = new MusicBrainzService();

  constructor(
    private readonly fileSystemService: FileSystemServicePort,
    private readonly librariesRepo: LibrariesRepositoryPort,
    private readonly albumsRepo: AlbumsRepositoryPort,
    private readonly songsRepo: SongsRepositoryPort,
    private readonly artistsRepo: ArtistsRepositoryPort,
    private readonly collectionsRepo: CollectionsRepositoryPort,
    private readonly notificationService: NotificationServicePort,
  ) {}

  /**
   * Main entry point.
   */
  async execute(library: Library, root: string): Promise<void> {
    musicLogger.info({ libraryId: library.id, root }, 'Starting music scan');

    if (!(await this.fileSystemService.isFolder(root))) {
      musicLogger.warn({ root }, 'Root is not a folder');
      return;
    }

    // Analyze folder structure
    const structure = await this.analyzeFolderStructure(root);

    if (structure.type === 'collection') {
      await this.processCollection(library, root, structure.albumFolders);
    } else {
      await this.processAlbum(library, root, structure.albumFolders[0], null);
    }
  }

  /**
   * Checks if folder name indicates a disc folder
   */
  private isDiscFolder(folderName: string): boolean {
    const normalized = folderName.toLowerCase().trim();
    const patterns = [
      /^disc?\s*\d+$/i, // Disc 1, Disk 2, disc 01
      /^disco\s*\d+$/i, // Disco 1, Disco 01
      /^cd\s*\d+$/i, // CD 1, CD01
      /^\d+$/, // 1, 01, 001
    ];
    return patterns.some((p) => p.test(normalized));
  }

  /**
   * Checks if folder name indicates an extras folder
   */
  private isExtrasFolder(folderPath: string): boolean {
    return (
      path.basename(folderPath).toLowerCase() === 'extras' ||
      path.basename(folderPath).toLowerCase() === 'extra'
    );
  }

  /**
   * Analyzes if root is a collection or single album
   */
  private async analyzeFolderStructure(root: string): Promise<{
    type: 'collection' | 'album';
    albumFolders: AlbumFolder[];
  }> {
    const contents = await this.fileSystemService.getFilesInFolder(root);

    // Get direct music files
    const directMusicFiles: string[] = [];
    const subFolders: { name: string; path: string }[] = [];

    for (const item of contents) {
      const itemPath = `${root}/${item.name}`;
      if ((await this.fileSystemService.isFolder(itemPath)) && !this.isExtrasFolder(itemPath)) {
        subFolders.push({ name: item.name, path: itemPath });
      } else if (this.fileSystemService.isAudioFile(itemPath)) {
        directMusicFiles.push(itemPath);
      }
    }

    // Has direct music files = album
    if (directMusicFiles.length > 0) {
      return {
        type: 'album',
        albumFolders: [{ path: root, musicFiles: directMusicFiles }],
      };
    }

    // Check subfolders
    const discFolders: string[] = [];
    const albumFolders: AlbumFolder[] = [];

    for (const folder of subFolders) {
      if (this.isDiscFolder(folder.name)) {
        discFolders.push(folder.path);
      } else {
        const files = await this.fileSystemService.getValidMusicFiles(folder.path);
        if (files.length > 0) {
          albumFolders.push({ path: folder.path, musicFiles: files });
        }
      }
    }

    // Has disc folders = album
    if (discFolders.length > 0) {
      const allMusicFiles = await this.fileSystemService.getValidMusicFiles(root);
      return {
        type: 'album',
        albumFolders: [{ path: root, musicFiles: allMusicFiles }],
      };
    }

    // Has album folders = collection
    if (albumFolders.length > 0) {
      return {
        type: 'collection',
        albumFolders,
      };
    }

    // Empty or no music
    return {
      type: 'album',
      albumFolders: [],
    };
  }

  /**
   * Processes a collection of albums
   */
  private async processCollection(
    library: Library,
    root: string,
    albumFolders: AlbumFolder[],
  ): Promise<void> {
    const collection = await this.writeQueue.enqueue(async () => {
      return await this.getOrCreateCollection(library, root);
    });

    if (!collection) {
      musicLogger.error({ root }, 'Failed to create collection');
      return;
    }

    this.notificationService.broadcast(
      JSON.stringify({
        header: 'MUSIC_SCAN_PROGRESS',
        body: {
          collectionId: collection.id,
          status: 'started',
          processed: 0,
          total: albumFolders.length,
        },
      }),
    );

    let processed = 0;
    for (const albumFolder of albumFolders) {
      await this.processAlbum(library, root, albumFolder, collection);
      processed++;

      if (processed % 5 === 0 || processed === albumFolders.length) {
        this.notificationService.broadcast(
          JSON.stringify({
            header: 'MUSIC_SCAN_PROGRESS',
            body: {
              collectionId: collection.id,
              status: 'processing',
              processed,
              total: albumFolders.length,
            },
          }),
        );
      }
    }

    this.notificationService.mutateLibrary(library.id);
    this.notificationService.broadcast(
      JSON.stringify({
        header: 'MUSIC_SCAN_PROGRESS',
        body: {
          collectionId: collection.id,
          status: 'completed',
          processed,
          total: albumFolders.length,
        },
      }),
    );
  }

  /**
   * Processes a single album folder
   */
  private async processAlbum(
    library: Library,
    rootFolder: string,
    albumFolder: AlbumFolder,
    collection: Collection | null,
  ): Promise<void> {
    await this.writeQueue.enqueue(async () => {
      // Extract sample metadata from first file
      const sampleFile = albumFolder.musicFiles[0];
      const sampleMetadata = await getAudioInfo(sampleFile);

      if (!sampleMetadata) {
        musicLogger.warn({ path: albumFolder.path }, 'No metadata in sample file');
        return;
      }

      const albumTitle = sampleMetadata.album || getFileName(albumFolder.path);
      const artistName = sampleMetadata.artists?.[0] || 'Unknown Artist';
      // Search MusicBrainz for album + artist metadata
      const mbAlbum = await this.musicBrainz.searchRelease(albumTitle, artistName);

      let album: Album | null = null;

      if (mbAlbum) {
        musicLogger.info({ path: albumFolder.path, mbid: mbAlbum.mbid }, 'Found in MusicBrainz');

        album = await this.albumsRepo.create({
          title: mbAlbum.title,
          year: mbAlbum.releaseDate ? new Date(mbAlbum.releaseDate).getFullYear().toString() : '',
          libraryId: library.id,
          description: mbAlbum.annotation,
          folder: albumFolder.path,
          genres: sampleMetadata.genres || [],
          coverSrc: '',
        });

        // Download cover from MusicBrainz
        if (album && mbAlbum.coverArtUrl) {
          const coverPath = await this.downloadCover(mbAlbum.coverArtUrl, album.id);
          if (coverPath) {
            album.coverSrc = coverPath;
            await this.albumsRepo.update(album.id, { coverSrc: coverPath });

            // Set collection cover if empty
            if (collection && collection.musicPosterSrc === '') {
              await this.collectionsRepo.update(collection.id, {
                musicPosterSrc: coverPath,
              });
            }
          }
        }

        // Process artist
        if (album) {
          await this.processArtist(mbAlbum.artist, album.id);
        }
      } else {
        musicLogger.info({ path: albumFolder.path }, 'Not found in MusicBrainz');

        album = await this.albumsRepo.create({
          title: albumTitle,
          year: sampleMetadata.date ? new Date(sampleMetadata.date).getFullYear().toString() : '',
          libraryId: library.id,
          folder: albumFolder.path,
          genres: sampleMetadata.genres || [],
          coverSrc: '',
        });

        // Search for local cover
        if (album) {
          const localCover = await this.findLocalCover(albumFolder.path);
          if (localCover) {
            const coverPath = await this.copyImageToEntity(album.id, localCover);
            if (coverPath) {
              album.coverSrc = coverPath;
              await this.albumsRepo.update(album.id, { coverSrc: coverPath });

              if (collection && collection.musicPosterSrc === '') {
                await this.collectionsRepo.update(collection.id, {
                  musicPosterSrc: coverPath,
                });
              }
            }
          }

          // Process artists from file
          for (const artist of sampleMetadata.artists || []) {
            await this.processArtist(artist, album.id);
          }
        }
      }

      if (!album) {
        musicLogger.error({ path: albumFolder.path }, 'Failed to create album');
        return;
      }

      // Add to collection
      if (collection) {
        await this.collectionsRepo
          .addAlbum(collection.id, album.id)
          .catch((error) => musicLogger.error({ error }, 'Failed to add album to collection'));
      }

      this.notificationService.mutateLibrary(library.id);

      // Process all songs in album using file metadata
      for (const musicFile of albumFolder.musicFiles) {
        await this.processSong(library, musicFile, album);
      }
    });
  }

  /**
   * Processes a single song file using file metadata
   */
  private async processSong(library: Library, musicFile: string, album: Album): Promise<void> {
    try {
      const metadata = await getAudioInfo(musicFile);
      if (!metadata) return;

      // Check if already processed
      if (library.analyzedFiles[musicFile]) {
        return;
      }

      const song = await this.songsRepo.create({
        title: metadata.title || getFileName(musicFile),
        albumId: album.id,
        trackNumber: metadata.trackNumber || 0,
        discNumber: metadata.discNumber || 1,
        composers: metadata.composers || [],
        artists: metadata.artists || [],
        fileSrc: musicFile,
        duration: metadata.duration ? metadata.duration * 60 : 0,
        codec: metadata.codec || '',
      });

      if (!song) {
        musicLogger.error({ musicFile }, 'Failed to create song');
        return;
      }

      // Update library cache
      if (song.id) {
        library.analyzedFiles = {
          ...library.analyzedFiles,
          [musicFile]: song.id,
        };

        await this.librariesRepo.addAnalyzedFile(library.id, musicFile, song.id);
      }

      musicLogger.debug({ musicFile, songId: song.id }, 'Song processed');
    } catch (error) {
      musicLogger.error({ error, musicFile }, 'Error processing song');
    }
  }

  /**
   * Gets or creates collection
   */
  private async getOrCreateCollection(library: Library, root: string): Promise<Collection | null> {
    const title = getFileName(root);

    const existing = await this.collectionsRepo.getByName(title);
    if (existing) {
      await this.collectionsRepo.addLibrary(library.id, existing.id);
      return existing;
    }

    const collection = await this.collectionsRepo.add({ title });
    if (collection) {
      await this.collectionsRepo.addLibrary(library.id, collection.id);
    }
    return collection;
  }

  /**
   * Processes artist (creates if needed and links to album)
   */
  private async processArtist(artistName: string, albumId: string): Promise<void> {
    try {
      let artist = await this.artistsRepo.getByName(artistName);
      if (!artist) {
        artist = await this.artistsRepo.add({ name: artistName });
      }
      if (artist && artist.id) {
        await this.albumsRepo.addArtistToAlbum(artist.id, albumId);
      }
    } catch (error) {
      musicLogger.error({ error, artistName }, 'Failed to process artist');
    }
  }

  /**
   * Downloads cover from MusicBrainz
   */
  private async downloadCover(url: string, entityId: string): Promise<string | null> {
    try {
      const imageBuffer = await this.musicBrainz.downloadCoverArt(url);
      if (!imageBuffer) return null;

      const extension = url.endsWith('.png') ? 'png' : 'jpg';
      const imageName = `cover.${extension}`;
      const destinationFolder = this.fileSystemService.getExternalPath(
        path.join('resources', 'img', 'posters', entityId),
      );
      const destinationPath = path.join(destinationFolder, imageName);

      this.fileSystemService.createFolder(destinationFolder);
      await fsPromises.writeFile(destinationPath, imageBuffer);

      return path.join('resources', 'img', 'posters', entityId, imageName).replace(/\\/g, '/');
    } catch (error) {
      musicLogger.error({ error, url }, 'Error downloading cover');
      return null;
    }
  }

  /**
   * Finds local cover in folder hierarchy
   */
  private async findLocalCover(albumPath: string): Promise<string | null> {
    let imageSrc = await this.fileSystemService.findImageInFolder(albumPath);

    if (!imageSrc) {
      const parentFolder = path.resolve(albumPath, '..');
      imageSrc = await this.fileSystemService.findImageInFolder(parentFolder);
    }

    return imageSrc;
  }

  /**
   * Copies image to entity folder
   */
  private async copyImageToEntity(
    entityId: string,
    sourceImagePath: string,
  ): Promise<string | null> {
    const imageName = path.basename(sourceImagePath);
    const destinationFolder = this.fileSystemService.getExternalPath(
      path.join('resources', 'img', 'posters', entityId),
    );
    const destinationPath = path.join(destinationFolder, imageName);

    try {
      this.fileSystemService.createFolder(destinationFolder);
      await fsPromises.copyFile(sourceImagePath, destinationPath);

      return path.join('resources', 'img', 'posters', entityId, imageName).replace(/\\/g, '/');
    } catch (error) {
      musicLogger.error({ error, sourceImagePath }, 'Error copying image');
      return null;
    }
  }
}
