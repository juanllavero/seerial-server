import ffmetadata from "ffmetadata";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import { Collection } from "../../data/models/Collections/Collection.model";
import { Library } from "../../data/models/Media/Library.model";
import { Album } from "../../data/models/music/Album.model";
import { getAlbums } from "../../db/get/getData";
import {
  addAlbum,
  addAlbumToCollection,
  addArtist,
  addArtistToAlbum,
  addCollection,
  addLibraryToCollection,
  addSong,
} from "../../db/post/postData";
import { FilesManager } from "../../utils/FilesManager";
import { Utils } from "../../utils/Utils";
import { WebSocketManager } from "../../WebSockets/WebSocketManager";

//#region MUSIC METADATA EXTRACTION
export async function scanMusic(
  library: Library,
  folder: string,
  wsManager: WebSocketManager
) {
  if (!(await Utils.isFolder(folder))) return;

  ffmetadata.setFfmpegPath(ffmpegPath || "");

  // Add collection or retrieve existing one
  const collection = await addCollection({
    title: Utils.getFileName(folder),
  });

  if (!collection) return;

  await addLibraryToCollection(library.id, collection.id);

  // Get music files inside folder (4 folders of depth)
  const musicFiles = await Utils.getMusicFiles(folder);

  // Process each file
  for (const file of musicFiles) {
    if (!library.analyzedFiles[file]) {
      await processMusicFile(library, file, collection, wsManager);
    }
  }

  // Update content in clients
  Utils.mutateLibrary(wsManager);
}

export async function processMusicFile(
  library: Library,
  musicFile: string,
  collection: Collection,
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

    const artistName = data["album_artist"] ? data["album_artist"] : "";
    const albumName = data.album ? data.album : collection.title;

    let newAlbum: Album | null = null;

    const albums = await getAlbums(library.id);

    if (albums) {
      for (const album of albums) {
        if (album.title === albumName) {
          newAlbum = album;
          break;
        }
      }
    }

    if (!newAlbum) {
      newAlbum = await addAlbum({
        title: albumName ?? "Unknown",
        year: data.date
          ? new Date(data.date).getFullYear().toString()
          : data["TYER"]
          ? new Date(data["TYER"]).getFullYear().toString()
          : "",
        libraryId: library.id,
        genres: data.genre
          ? data.genre.split(",").map((genre: string) => genre.trim())
          : [],
      });

      // Update content in clients
      Utils.mutateLibrary(wsManager);
    }

    if (!newAlbum) return;

    await addAlbumToCollection(collection.id, newAlbum.id);

    const song = await addSong({
      title: data.title ?? Utils.getFileName(musicFile),
      albumId: newAlbum.id,
      trackNumber: data.track ? Number.parseInt(data.track) : 0,
      discNumber: data["disc"] ? Number.parseInt(data["disc"]) : 0,
      composers: data.composer
        ? data.composer.split(",").map((composer: string) => composer.trim())
        : [],
      artists: data.artist
        ? data.artist.split(",").map((artist: string) => artist.trim())
        : [],
      fileSrc: musicFile,
      duration: 0,
    });

    if (artistName) {
      const artist = await addArtist({
        name: artistName,
      });

      if (artist) {
        addArtistToAlbum(artist.id, newAlbum.id);
      }
    }

    if (newAlbum.coverSrc === "") {
      // Search for image in the same folder
      let imageSrc = await Utils.findImageInFolder(path.dirname(musicFile));

      // If no image is found in the same folder, search in the parent folder
      if (!imageSrc) {
        const parentFolder = path.resolve(path.dirname(musicFile), "..");
        imageSrc = await Utils.findImageInFolder(parentFolder);
      }

      if (imageSrc) {
        FilesManager.createFolder(
          FilesManager.getExternalPath("resources/img/posters/" + newAlbum.id)
        );
        let destPath = FilesManager.getExternalPath(
          "resources/img/posters/" +
            newAlbum.id +
            "/" +
            imageSrc.split("\\").pop()
        );
        fs.copyFile(imageSrc, destPath, (err: any) => {
          if (err) {
            console.error("Error copying image:", err);
            return;
          }
        });

        newAlbum.coverSrc =
          "resources/img/posters/" +
          newAlbum.id +
          "/" +
          imageSrc.split("\\").pop();

        if (collection.musicPosterSrc === "") {
          FilesManager.createFolder(
            FilesManager.getExternalPath(
              "resources/img/posters/" + collection.id
            )
          );
          let destPath = FilesManager.getExternalPath(
            "resources/img/posters/" +
              collection.id +
              "/" +
              imageSrc.split("\\").pop()
          );
          fs.copyFile(imageSrc, destPath, (err: any) => {
            if (err) {
              console.error("Error copying image:", err);
              return;
            }
          });

          collection.musicPosterSrc =
            "resources/img/posters/" +
            collection.id +
            "/" +
            imageSrc.split("\\").pop();
        }
      }

      // Update content in clients
      Utils.mutateLibrary(wsManager);
    }

    if (!song) return;

    // Get runtime
    await Utils.getOnlyRuntime(song, musicFile);

    await library.addAnalyzedFile(musicFile, song.id);

    // Save data in DB
    library.save();
    collection.save();
    newAlbum.save();
    song.save();

    // Update content in clients
    Utils.mutateAlbum(wsManager);
  } catch (error) {
    console.error("Error processing music file", error);
  }
}
//#endregion
