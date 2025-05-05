import { path } from "ffprobe-static";
import { wsManager } from "../..";
import ffmetadata from 'ffmetadata';
import ffmpegPath from 'ffmpeg-static';
import { Series, Season } from "../../data/interfaces/Media";
import { Season } from "../../data/models/Media/Season.model";
import { Series } from "../../data/models/Media/Series.model";
import { FilesManager } from "../../utils/FilesManager";
import { Utils } from "../../utils/Utils";
import { WebSocketManager } from "../../WebSockets/WebSocketManager";
import { FileSearch } from "../FileSearch";

  //#region MUSIC METADATA EXTRACTION
  export async function scanMusic(folder: string, wsManager: WebSocketManager) {
    if (!(await Utils.isFolder(folder))) return;

    ffmetadata.setFfmpegPath(ffmpegPath || '');

    let collection: Series | null;

    if (!FileSearch.library.analyzedFolders.get(folder)) {
      collection = new Series();
      collection.setName(Utils.getFileName(folder));
      collection.analyzingFiles = true;
      FileSearch.library.series.push(collection);
      FileSearch.library.analyzedFolders.set(folder, collection.id);

      // Add show to view
      Utils.addSeries(wsManager, FileSearch.library.id, collection);
    } else {
      collection = FileSearch.library.getSeriesById(
        FileSearch.library.analyzedFolders.get(folder) || ''
      );
    }

    if (collection === null || !collection) return;

    collection.analyzingFiles = true;

    // Get music files inside folder (4 folders of depth)
    const musicFiles = await Utils.getMusicFiles(folder);

    // Process each file
    for (const file of musicFiles) {
      if (!FileSearch.library.analyzedFiles.get(file)) {
        await this.processMusicFile(file, collection, wsManager);
      }
    }

    collection.isCollection = collection.seasons.length > 1;
    collection.analyzingFiles = false;

    // Update show in view
    Utils.updateSeries(wsManager, FileSearch.library.id, collection);
  }

  private static async processMusicFile(
    musicFile: string,
    collection: Series,
    wsManager: WebSocketManager
  ) {
    try {
      const data = await new Promise<any>((resolve, reject) => {
        ffmetadata.read(musicFile, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      const artistName = data['album_artist'] ? data['album_artist'] : '';
      const albumName = data.album ?? 'Unknown';

      let album: Season | null = null;

      for (const season of collection.seasons) {
        if (season.name === albumName) {
          album = season;
          break;
        }
      }

      if (album === null) {
        album = new Season();
        album.setName(albumName ?? 'Unknown');
        album.setSeriesID(collection.id);
        album.setYear(
          data.date
            ? new Date(data.date).getFullYear().toString()
            : data['TYER']
            ? new Date(data['TYER']).getFullYear().toString()
            : ''
        );
        album.setGenres(
          data.genre
            ? data.genre.split(',').map((genre: string) => genre.trim())
            : []
        );
        collection.seasons.push(album);

        // Add season to view
        Utils.addSeason(wsManager, FileSearch.library.id, album);
      }

      let song = new EpisodeLocal();
      song.setName(data.title ?? Utils.getFileName(musicFile));
      song.setYear(
        data.date
          ? new Date(data.date).getFullYear().toString()
          : data['TYER']
          ? new Date(data['TYER']).getFullYear().toString()
          : ''
      );
      song.setSeasonNumber(data['disc'] ? Number.parseInt(data['disc']) : 0);
      song.setEpisodeNumber(data.track ? Number.parseInt(data.track) : 0);
      song.album = albumName ?? 'Unknown';
      song.albumArtist = artistName ?? 'Unknown';
      song.setDirectedBy(
        data.artist
          ? data.artist.split(',').map((artist: string) => artist.trim())
          : []
      );
      song.setWrittenBy(
        data.composer
          ? data.composer.split(',').map((composer: string) => composer.trim())
          : []
      );

      if (album.coverSrc === '') {
        // Search for image in the same folder
        let imageSrc = await Utils.findImageInFolder(path.dirname(musicFile));

        // If no image is found in the same folder, search in the parent folder
        if (!imageSrc) {
          const parentFolder = path.resolve(path.dirname(musicFile), '..');
          imageSrc = await Utils.findImageInFolder(parentFolder);
        }

        if (imageSrc) {
          FilesManager.createFolder(
            FilesManager.getExternalPath('resources/img/posters/' + album.id)
          );
          let destPath = FilesManager.getExternalPath(
            'resources/img/posters/' +
              album.id +
              '/' +
              imageSrc.split('\\').pop()
          );
          fs.copyFile(imageSrc, destPath, (err: any) => {
            if (err) {
              console.error('Error copying image:', err);
              return;
            }
          });

          album.setCoverSrc(
            'resources/img/posters/' +
              album.id +
              '/' +
              imageSrc.split('\\').pop()
          );

          if (collection.coverSrc === '') {
            FilesManager.createFolder(
              FilesManager.getExternalPath(
                'resources/img/posters/' + collection.id
              )
            );
            let destPath = FilesManager.getExternalPath(
              'resources/img/posters/' +
                collection.id +
                '/' +
                imageSrc.split('\\').pop()
            );
            fs.copyFile(imageSrc, destPath, (err: any) => {
              if (err) {
                console.error('Error copying image:', err);
                return;
              }
            });

            collection.setCoverSrc(
              'resources/img/posters/' +
                collection.id +
                '/' +
                imageSrc.split('\\').pop()
            );
          }
        }
      }

      // Get runtime
      await Utils.getOnlyRuntime(song, musicFile);

      song.setVideoSrc(musicFile);
      album.addEpisode(song);
      FileSearch.library.analyzedFiles.set(musicFile, song.id);

      // Add episode to view
      Utils.addEpisode(wsManager, FileSearch.library.id, collection.id, song);
    } catch (error) {
      console.error('Error processing music file', error);
    }
  }
  //#endregion
