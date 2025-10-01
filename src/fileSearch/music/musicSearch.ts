import { Collection } from "@/data/models/Collections/Collection.model";
import { Library } from "@/data/models/Media/Library.model";
import { Album } from "@/data/models/music/Album.model";
import { getAlbums } from "@/db/get/getData";
import {
  addAlbum,
  addAlbumToCollection,
  addArtist,
  addArtistToAlbum,
  addCollection,
  addLibraryToCollection,
  addSong,
} from "@/db/post/postData";
import { getAudioInfo } from "@/ffmpeg/audioInfo";
import { FilesManager } from "@/managers/FilesManager";
import { WebSocketManager } from "@/managers/WebSocketManager";
import { Utils } from "@/utils/Utils";
import ffprobePath from "ffprobe-static";
import ffmpeg from "fluent-ffmpeg";
import { promises as fsPromises } from "fs";
import path from "path";

/**
 * Scans a folder for music files and adds them to the library
 * @param {Library} library Library object
 * @param {string} folder Folder to scan for music files
 * @param {WebSocketManager} wsManager WebSocket Manager to update the info in the client apps
 * @returns {Promise<void>} Promise that resolves when all files have been processed
 */
export async function scanMusic(
  library: Library,
  folder: string,
  wsManager: WebSocketManager
) {
  if (!(await Utils.isFolder(folder))) return;

  ffmpeg.setFfprobePath(ffprobePath.path);

  // Add collection or retrieve existing one
  const collection = await addCollection({
    title: Utils.getFileName(folder),
  });

  if (!collection) return;

  await addLibraryToCollection(library.id, collection.id);

  // Get music files inside folder (4 folders of depth)
  const musicFiles = await Utils.getMusicFiles(folder);

  // Cache albums to avoid heap overflow
  const allAlbums = (await getAlbums(library.id)) || [];
  const albumMap = new Map(allAlbums.map((album) => [album.title, album]));

  //Process each file
  for (const file of musicFiles) {
    if (!library.analyzedFiles[file]) {
      await processMusicFile(
        folder,
        library,
        file,
        collection,
        wsManager,
        albumMap
      );
    }
  }

  // Update content in clients
  Utils.mutateLibrary(wsManager);
}

/**
 * Processes a single music file.
 * @param rootFolder Root folder of the library
 * @param library Library containing the music file
 * @param musicFile Music file to process
 * @param collection Collection that the music file belongs to
 * @param wsManager WebSocket manager to send updates to client
 * @param albumMap Cache of albums to avoid heap overflow
 * @returns Promise that resolves when the music file has been processed
 */
export async function processMusicFile(
  rootFolder: string,
  library: Library,
  musicFile: string,
  collection: Collection,
  wsManager: WebSocketManager,
  albumMap: Map<string, Album>
) {
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
      newAlbum = await addAlbum({
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
      Utils.mutateLibrary(wsManager);
    }

    if (!newAlbum) return;

    await addAlbumToCollection(collection.id, newAlbum.id);

    const song = await addSong({
      title: title !== "" ? title : Utils.getFileName(musicFile),
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

      if (newArtist) {
        addArtistToAlbum(newArtist.id, newAlbum.id);
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

        try {
          await fsPromises.copyFile(imageSrc, destPath);
        } catch (err) {
          console.error("Error copying image:", err);
        }

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

          try {
            await fsPromises.copyFile(imageSrc, destPath);
          } catch (err) {
            console.error("Error copying image:", err);
          }

          collection.musicPosterSrc =
            "resources/img/posters/" +
            collection.id +
            "/" +
            imageSrc.split("\\").pop();
        }
      }

      await newAlbum.save();

      // Update content in clients
      Utils.mutateLibrary(wsManager);
    }

    if (!song) return;

    await library.addAnalyzedFile(musicFile, song.id);

    // Save data in DB
    await library.save();
    await collection.save();
    await newAlbum.save();
    await song.save();
  } catch (error) {
    console.error("Error processing music file", error);
  }
}
