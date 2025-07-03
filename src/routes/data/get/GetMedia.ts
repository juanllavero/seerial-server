import express from "express";
import { promises as fs } from "fs";
import path from "path";
import { Video } from "../../../data/models/Media/Video.model";
import {
  getAlbumById,
  getAlbums,
  getCollectionById,
  getCollections,
  getContinueWatchingVideos,
  getEpisodeById,
  getEpisodes,
  getLibraries,
  getLibraryById,
  getMovieById,
  getMovies,
  getMoviesInMyList,
  getSeasonById,
  getSeasons,
  getSeries,
  getSeriesById,
  getSeriesInMyList,
  getSongById,
  getVideoByEpisodeId,
  getVideoById,
  getVideoByMovieId,
} from "../../../db/get/getData";
import { Downloader } from "../../../downloaders/Downloader";
import { FileSearch } from "../../../fileSearch/FileSearch";
import { clearLibrary } from "../../../fileSearch/utils";
import { MovieDBWrapper } from "../../../theMovieDB/MovieDB";
import { FilesManager } from "../../../utils/FilesManager";
import { IMDBScores } from "../../../utils/IMDBScores";
import { Utils } from "../../../utils/Utils";
import { WebSocketManager } from "../../../WebSockets/WebSocketManager";
const router = express.Router();

router.get("/library", async (req, res) => {
  const { id } = req.query;

  if (!id || id === "") return;

  res.json(await getLibraryById(id as string));
});

//#region LISTS
router.get("/libraries", async (_req, res) => {
  res.json(await getLibraries());
});

router.get("/collections", async (req, res) => {
  res.json(await getCollections());
});

router.get("/series", async (req, res) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === "") return;

  res.json(await getSeries(libraryId as string));
});

router.get("/movies", async (req, res) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === "") return;

  res.json(await getMovies(libraryId as string));
});

router.get("/seasons", async (req, res) => {
  const { seriesId } = req.query;

  if (!seriesId || seriesId === "") return;

  res.json(await getSeasons(seriesId as string));
});

router.get("/episodes", async (req, res) => {
  const { seasonId } = req.query;

  if (!seasonId || seasonId === "") return;

  res.json(await getEpisodes(seasonId as string));
});

router.get("/albums", async (req, res) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === "") return;

  res.json(await getAlbums(libraryId as string));
});

router.get("/myListSeries", async (req, res) => {
  res.json(await getSeriesInMyList());
});

router.get("/myListMovies", async (req, res) => {
  res.json(await getMoviesInMyList());
});

router.get("/continueWatching", async (req, res) => {
  res.json(await getContinueWatchingVideos());
});

//#endregion

//#region DETAILS

router.get("/details/collection", async (req, res) => {
  const { id } = req.query;

  if (!id || id === "") return;

  res.json(await getCollectionById(id as string));
});

router.get("/details/series", async (req, res) => {
  const { id } = req.query;

  if (!id || id === "") return;

  res.json(await getSeriesById(id as string));
});

router.get("/details/seriesBySeasonId", async (req, res) => {
  const { seasonId } = req.query;

  if (!seasonId || seasonId === "") return;

  const season = await getSeasonById(seasonId as string);

  if (!season) return;

  res.json(await getSeriesById(season.seriesId));
});

router.get("/details/season", async (req, res) => {
  const { id } = req.query;

  if (!id || id === "") return;

  res.json(await getSeasonById(id as string));
});

router.get("/details/episode", async (req, res) => {
  const { id } = req.query;

  if (!id || id === "") return;

  res.json(await getEpisodeById(id as string));
});

router.get("/details/video", async (req, res) => {
  const { id } = req.query;

  if (!id || id === "") return;

  res.json(await getVideoById(id as string));
});

router.get("/details/movie", async (req, res) => {
  const { id } = req.query;

  if (!id || id === "") return;

  res.json(await getMovieById(id as string));
});

router.get("/details/album", async (req, res) => {
  const { id } = req.query;

  if (!id || id === "") return;

  res.json(await getAlbumById(id as string));
});

router.get("/episode-video", async (req, res) => {
  const { episodeId } = req.query;

  if (!episodeId || episodeId === "") return;

  res.json(await getVideoByEpisodeId(episodeId as string));
});

router.get("/movie-video", async (req, res) => {
  const { movieId } = req.query;

  if (!movieId || movieId === "") return;

  res.json(await getVideoByMovieId(movieId as string));
});

//#endregion

// Search files in library
router.get("/library/search", async (req: any, res: any) => {
  const { libraryId } = req.query;

  const library = await getLibraryById(libraryId);

  if (!library) return;

  await clearLibrary(libraryId, WebSocketManager.getInstance());

  FileSearch.scanFiles(
    { id: library.id },
    WebSocketManager.getInstance(),
    false
  );

  res.json({});
});

// Search movies in TheMovieDB
router.get("/movies/search", (req: any, res: any) => {
  const { name, year } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Param name not found" });
  }

  MovieDBWrapper.searchMovies(name, year, 1).then((data) => res.json(data));
});

// Search episode groups in TheMovieDB
router.get("/episodeGroups/search", (req: any, res: any) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "Param id not found" });
  }

  MovieDBWrapper.searchEpisodeGroups(id).then((data) => res.json(data));
});

// Test endpoint to get the IMDB score given a IMDB ID
router.get("/imdbScore", (req: any, res: any) => {
  const id = req.query.id;

  IMDBScores.getIMDBScore(id).then((data) => res.json(data));
});

// Test endpoint to get chapters
router.get("/chapters", async (req: any, res: any) => {
  const path = req.query.path;

  const video = new Video({
    fileSrc: path,
  });

  res.json(await Utils.getChapters(video));
});

// Test endpoint to get media info
router.get("/mediaInfo", async (req: any, res: any) => {
  const path = req.query.path;

  const video = new Video({
    fileSrc: path,
  });

  await Utils.getMediaInfo(video);

  res.json(video);
});

// Get search videos results
router.get("/media/search", async (req: any, res: any) => {
  const { query } = req.query;

  if (typeof query !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const data = await Downloader.searchVideos(query, 20);
  res.json(data);
});

// Search shows in TheMovieDB
router.get("/shows/search", (req: any, res: any) => {
  const { name, year } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Param name not found" });
  }

  MovieDBWrapper.searchTVShows(name, year, 1).then((data) => res.json(data));
});

// Get movie background video
router.get("/movieVideo", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  const movie = await getMovieById(id as string);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  const folder = FilesManager.getExternalPath(
    `resources/video/${movie.libraryId}/`
  );

  const filename = Utils.getFileInFolder(folder, movie.id);
  if (!filename) {
    return res.status(404).json({ error: "File not found" });
  }

  const basename = path.basename(filename);
  const url = `/media/video/${movie.libraryId}/${basename}`;

  res.json({ url });
});

// Get movie background music
router.get("/movieMusic", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  const movie = await getMovieById(id as string);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  const folder = FilesManager.getExternalPath(
    `resources/music/${movie.libraryId}/`
  );

  const filename = Utils.getFileInFolder(folder, movie.id);
  if (!filename) {
    return res.status(404).json({ error: "File not found" });
  }

  const basename = path.basename(filename);
  const url = `/media/music/${movie.libraryId}/${basename}`;

  res.json({ url });
});

// Get season background video
router.get("/seasonVideo", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  const season = await getSeasonById(id as string);

  if (!season) {
    return res.status(404).json({ error: "Season not found" });
  }

  const folder = FilesManager.getExternalPath(
    `resources/video/${season.series.libraryId}/`
  );

  const filename = Utils.getFileInFolder(folder, season.id);
  if (!filename) {
    return res.status(404).json({ error: "File not found" });
  }

  const basename = path.basename(filename);
  const url = `/media/video/${season.series.libraryId}/${basename}`;

  res.json({ url });
});

// Get season background music
router.get("/seasonMusic", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  const season = await getSeasonById(id as string);

  if (!season) {
    return res.status(404).json({ error: "Season not found" });
  }

  const folder = FilesManager.getExternalPath(
    `resources/music/${season.series.libraryId}/`
  );

  const filename = Utils.getFileInFolder(folder, season.id);
  if (!filename) {
    return res.status(404).json({ error: "File not found" });
  }

  const basename = path.basename(filename);
  const url = `/media/music/${season.series.libraryId}/${basename}`;

  res.json({ url });
});

//#region LRC Lyrics
/**
 * Searches for lrc files that matches the name of the song which id has been given
 */
router.get("/lyrics", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") {
    return res.status(400).json({ error: "Song ID is required" });
  }

  try {
    const song = await getSongById(id as string);

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    const songDirectory = path.dirname(song.fileSrc);
    const songBaseName = path.basename(
      song.fileSrc,
      path.extname(song.fileSrc)
    );

    // Usamos la versión asíncrona para no bloquear el servidor
    const filesInDir = await fs.readdir(songDirectory);

    // 1. Filtramos primero para obtener solo los nombres de archivo relevantes
    const lyricFileNames = filesInDir.filter(
      (currentFile) =>
        currentFile.startsWith(songBaseName) && currentFile.endsWith(".lrc")
    );

    // 2. Mapeamos cada nombre de archivo a una promesa que lee su contenido
    const promises = lyricFileNames.map(async (fileName) => {
      // La lógica para extraer el idioma es la misma
      const potentialLangPart = fileName.substring(
        songBaseName.length,
        fileName.length - ".lrc".length
      );

      let language = "original";
      if (potentialLangPart.startsWith(".")) {
        language = potentialLangPart.substring(1);
      } else if (potentialLangPart !== "") {
        // Si el archivo no coincide con el patrón exacto (ej: song-copia.lrc),
        // devolvemos null para filtrarlo más tarde.
        return null;
      }

      // Construimos la ruta completa para poder leer el archivo
      const fullPath = path.join(songDirectory, fileName);

      // Leemos el contenido del archivo como un string en formato UTF-8
      const content = await fs.readFile(fullPath, "utf-8");

      // Devolvemos el objeto con el contenido y el idioma
      return { content, language };
    });

    // 3. Esperamos a que todas las promesas de lectura se completen
    const results = await Promise.all(promises);

    // 4. Filtramos cualquier resultado nulo y devolvemos el array final
    const lyricsData = results.filter((result) => result !== null);

    res.json(lyricsData);
  } catch (error) {
    console.error("Error searching for lyrics:", error);
    res.status(500).json({ error: "An internal error occurred" });
  }
});
//#endregion

//#region MUSIC EXTRAS
/**
 * @route   GET /musicExtras/:collectionId
 * @desc    Finds extra video files (concerts, interviews, etc.)
 * associated with all albums in a collection.
 */
router.get("/musicExtras/:collectionId", async (req: any, res: any) => {
  const { collectionId } = req.params;

  if (!collectionId) {
    return res.status(400).json({ error: "Collection ID is required" });
  }

  try {
    // 1. Get the collection
    const collection = await getCollectionById(collectionId as string);
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    // 2. Extract the distinct root folders using a Set to avoid duplicates
    const rootFolders = new Set<string>();
    collection.albums.forEach((album) => {
      if (album.folder) {
        rootFolders.add(album.folder);
      }
    });

    console.log({ rootFolders });

    // 3. Search in each root folder concurrently
    const promises = Array.from(rootFolders).map(async (folder) => {
      const foundExtras: { title: string; src: string; type: string }[] = [];

      // Check for the existence of 'extras' or 'Extras'
      const extrasPathCandidates = [
        path.join(folder, "extras"),
        path.join(folder, "Extras"),
      ];
      let extrasPath: string | undefined;

      for (const candidate of extrasPathCandidates) {
        try {
          // fs.stat will throw an error if the directory does not exist
          const stats = await fs.stat(candidate);
          if (stats.isDirectory()) {
            extrasPath = candidate;
            break; // We found one, no need to search further
          }
        } catch (error) {
          // Ignore the error (ENOENT: file not found) and continue
        }
      }

      console.log({ extrasPath });

      if (!extrasPath) {
        return []; // There is no 'extras' folder in this path, return an empty array
      }

      // Read the contents of the 'extras' directory
      const files = await fs.readdir(extrasPath);

      console.log({
        files,
      });

      for (const file of files) {
        const fileExt = path.extname(file).toLowerCase();

        // Only process if it is a known video file
        if (!Utils.videoExtensions.includes(fileExt)) {
          continue;
        }

        const baseName = path.basename(file, fileExt);

        // Check if the filename ends with any of the extra suffixes
        for (const type of Utils.extraTypes) {
          const suffix = `-${type}`;
          if (baseName.endsWith(suffix)) {
            // 4. Extract the title according to the rules
            const nameWithoutSuffix = baseName.substring(
              0,
              baseName.length - suffix.length
            );
            const titleParts = nameWithoutSuffix.split(" - ");

            const title =
              titleParts.length > 1
                ? titleParts.slice(1).join(" - ").trim()
                : nameWithoutSuffix.trim();

            // 5. Create the final object
            foundExtras.push({
              title,
              src: path.join(extrasPath, file), // Full path to the file
              type: type, // The type of extra without the dash
            });

            break; // Move to the next file once a type is found
          }
        }
      }

      return foundExtras;
    });

    // Wait for all folder searches to finish
    const results = await Promise.all(promises);

    // Flatten the array of arrays ([[], [extra1, extra2], []]) into a single array
    const allExtras = results.flat();

    res.json(allExtras);
  } catch (error) {
    console.error("Error searching for music extras:", error);
    res
      .status(500)
      .json({ error: "An internal error occurred while searching for extras" });
  }
});
//#endregion

/**
 * @route   GET /hasDolbyAtmos
 * @desc    Checks if any song in a collection or album has Dolby Atmos
 */
router.get("/hasDolbyAtmos", async (req: any, res: any) => {
  const { collectionId, albumId } = req.query;

  if (!collectionId && !albumId) {
    return res.status(400).json({ error: "At least 1 ID is required" });
  }

  if (collectionId) {
    const collection = await getCollectionById(collectionId as string);

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const albums = collection.albums;

    let hasDolbyAtmos = false;

    for (const album of albums) {
      const song = album.songs.find((song) => song.hasDolbyAtmos);
      if (song) {
        hasDolbyAtmos = true;
        break;
      }
    }

    res.json({ hasDolbyAtmos });
  } else if (albumId) {
    const album = await getAlbumById(albumId as string);

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    const song = album.songs.find((song) => song.hasDolbyAtmos);

    if (song) {
      res.json({ hasDolbyAtmos: true });
    } else {
      res.json({ hasDolbyAtmos: false });
    }
  }

  res.json({ hasDolbyAtmos: false });
});

export default router;
