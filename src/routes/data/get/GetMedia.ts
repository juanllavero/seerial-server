import express from "express";
import { existsSync } from "fs";
import * as fs from "fs/promises";
import path from "path";
import { Album, Collection, Movie, Series } from "../../../data/models";
import {
  getAlbumById,
  getAlbums,
  getCollectionById,
  getCollectionsInLibrary,
  getContinueWatchingVideos,
  getEpisodeById,
  getEpisodes,
  getItemsForLibrary,
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
import { getAudioInfo } from "../../../ffmpeg/audioInfo";
import { getChapters, getMediaInfo } from "../../../ffmpeg/mediaInfo";
import { FileSearch } from "../../../fileSearch/FileSearch";
import { clearLibrary, getCollectionItemsKey } from "../../../fileSearch/utils";
import { MovieDBWrapper } from "../../../theMovieDB/MovieDB";
import { FilesManager } from "../../../utils/FilesManager";
import { IMDBScores } from "../../../utils/IMDBScores";
import { Utils } from "../../../utils/Utils";
import { WebSocketManager } from "../../../WebSockets/WebSocketManager";
const router = express.Router();

router.get("/library", async (req: any, res: any) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== "string" || id === "") {
      return res.status(400).json({ message: "No ID provided or invalid ID." });
    }

    const library = await getLibraryById(id);

    if (!library) {
      return res
        .status(404)
        .json({ message: `Library with ID ${id} not found.` });
    }

    return res.json(library);
  } catch (error) {
    console.error("Error in /library:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

//#region LISTS
router.get("/libraries", async (_req: any, res: any) => {
  return res.json(await getLibraries());
});

/**
 * Get the content of a library
 * @route GET /library-content
 */
router.get("/library-content", async (req: any, res: any) => {
  const { libraryId, type } = req.query;

  if (!libraryId) {
    return res.status(400).json({ error: "Library ID is required" });
  }

  try {
    const [collections, allItems] = await Promise.all([
      getCollectionsInLibrary(libraryId as string, type),
      getItemsForLibrary(libraryId as string, type),
    ]);

    if (!collections || !allItems) {
      return res.status(500).json({ error: "Failed to fetch library content" });
    }

    const itemIdsInCollections = new Set<string>();
    collections.forEach((collection) => {
      const itemsKey = getCollectionItemsKey(type);
      const items = (collection.get(itemsKey) as { id: string }[]) || [];
      items.forEach((item) => itemIdsInCollections.add(item.id));
    });

    const itemsNotInCollections = allItems.filter(
      (item) => !itemIdsInCollections.has(item.id)
    );

    const unifiedContent = [];

    for (const collection of collections) {
      if (
        (!collection.shows || collection.shows.length === 0) &&
        (!collection.movies || collection.movies.length === 0) &&
        (!collection.albums || collection.albums.length === 0)
      ) {
        continue;
      }

      const collectionData = collection.get({ plain: true });

      if (!collectionData.LibraryCollection) {
        return res
          .status(500)
          .json({ error: "Failed to fetch library content" });
      }

      const collectionImages = await getCollectionImages(collection, type);

      unifiedContent.push({
        type: "collection",
        order: collectionData.LibraryCollection.customOrder,
        data: {
          id: collectionData.id,
          title: collectionData.title,
          images: collectionImages,
          posterSrc:
            collectionData.posterSrc ??
            (type === "Movies" &&
              collectionData.movies &&
              collectionData.movies.length === 1)
              ? collectionData.movies[0].coverSrc ?? undefined
              : collectionData.shows && collectionData.shows.length === 1
              ? collectionData.shows[0].coverSrc ?? undefined
              : undefined,
          musicPosterSrc:
            collectionData.musicPosterSrc ??
            (collectionData.albums && collectionData.albums.length === 1)
              ? collectionData.albums[0].coverSrc ?? undefined
              : undefined,
          numberOfItems:
            type === "Movies"
              ? collectionData.movies.length
              : type === "Shows" || type === "Series"
              ? collectionData.shows.length
              : type === "Music"
              ? collectionData.albums.length
              : 0,
        },
      });
    }

    for (const item of itemsNotInCollections) {
      const remainingItems =
        getCollectionItemsKey(type) === "movies"
          ? await getRemainingVideos(item.id)
          : getCollectionItemsKey(type) === "shows"
          ? await getRemainingEpisodes(item.id)
          : 0;
      unifiedContent.push({
        type: getCollectionItemsKey(type),
        order: item.order || 0,
        data: item,
        remainingItems,
      });
    }

    unifiedContent.sort((a, b) => a.order - b.order);
    return res.json({ content: unifiedContent });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

const getRemainingVideos = async (itemId: string) => {
  const movie = await getMovieById(itemId);

  if (!movie) {
    return 0;
  }

  let remainingVideos = 0;
  for (const video of movie.videos) {
    if (!video.watchList) {
      remainingVideos++;
    }
  }

  return remainingVideos;
};

const getRemainingEpisodes = async (itemId: string) => {
  const series = await getSeriesById(itemId);

  if (!series) {
    return 0;
  }

  let remainingEpisodes = 0;
  for (const s of series.seasons) {
    const season = await getSeasonById(s.id);

    if (!season) continue;

    for (const episode of season.episodes) {
      const video = await getVideoByEpisodeId(episode.id);
      if (video && !video.watchList) {
        remainingEpisodes++;
      }
    }
  }

  return remainingEpisodes;
};

/**
 * Get the content of a library optimized for non manager clients (only the needed data)
 * @route GET /library-content-flat
 */
router.get("/library-content-flat", async (req: any, res: any) => {
  const { libraryId, type } = req.query;

  if (!libraryId) {
    return res.status(400).json({ error: "Library ID is required" });
  }

  try {
    const [collections, allItems] = await Promise.all([
      getCollectionsInLibrary(libraryId as string, type),
      getItemsForLibrary(libraryId as string, type),
    ]);

    if (!collections || !allItems) {
      return res.status(500).json({ error: "Failed to fetch library content" });
    }

    const itemIdsInCollections = new Set<string>();
    collections.forEach((collection) => {
      const itemsKey = getCollectionItemsKey(type);
      const items = (collection.get(itemsKey) as { id: string }[]) || [];
      items.forEach((item) => itemIdsInCollections.add(item.id));
    });

    const itemsNotInCollections = allItems.filter(
      (item) => !itemIdsInCollections.has(item.id)
    );

    const unifiedContent = [];

    for (const collection of collections) {
      if (
        (!collection.shows || collection.shows.length === 0) &&
        (!collection.movies || collection.movies.length === 0) &&
        (!collection.albums || collection.albums.length === 0)
      ) {
        continue;
      }

      const collectionData = collection.get({ plain: true });

      if (!collectionData.LibraryCollection) {
        return res
          .status(500)
          .json({ error: "Failed to fetch library content" });
      }

      const collectionImages = await getCollectionImages(collection, type);

      unifiedContent.push({
        type: "collection",
        order: collectionData.LibraryCollection.customOrder,
        data: {
          id: collectionData.id,
          title: collectionData.title,
          images: collectionImages,
          posterSrc:
            collectionData.posterSrc ??
            (type === "Movies" &&
              collectionData.movies &&
              collectionData.movies.length === 1)
              ? collectionData.movies[0].coverSrc ?? undefined
              : collectionData.shows && collectionData.shows.length === 1
              ? collectionData.shows[0].coverSrc ?? undefined
              : undefined,
          musicPosterSrc:
            collectionData.musicPosterSrc ??
            (collectionData.albums && collectionData.albums.length === 1)
              ? collectionData.albums[0].coverSrc ?? undefined
              : undefined,
          numberOfItems:
            type === "Movies"
              ? collectionData.movies.length
              : type === "Shows" || type === "Series"
              ? collectionData.shows.length
              : type === "Music"
              ? collectionData.albums.length
              : 0,
        },
      });
    }

    for (const item of itemsNotInCollections) {
      const itemType = getCollectionItemsKey(type);
      unifiedContent.push({
        type: itemType,
        order: item.order || 0,
        data: {
          id: item.id,
          year: item.year,
          title:
            itemType === "albums"
              ? (item as Album).title
              : itemType === "movies"
              ? (item as Movie).name
              : (item as Series).name,
          posterSrc: item.coverSrc,
        },
      });
    }

    unifiedContent.sort((a, b) => a.order - b.order);
    return res.json(unifiedContent);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/series", async (req: any, res: any) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === "") return;

  return res.json(await getSeries(libraryId as string));
});

router.get("/movies", async (req: any, res: any) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === "") return;

  return res.json(await getMovies(libraryId as string));
});

router.get("/seasons", async (req: any, res: any) => {
  const { seriesId } = req.query;

  if (!seriesId || seriesId === "") return;

  return res.json(await getSeasons(seriesId as string));
});

router.get("/episodes", async (req: any, res: any) => {
  const { seasonId } = req.query;

  if (!seasonId || seasonId === "") return;

  return res.json(await getEpisodes(seasonId as string));
});

router.get("/albums", async (req: any, res: any) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === "") return;

  return res.json(await getAlbums(libraryId as string));
});

router.get("/myListSeries", async (req: any, res: any) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  return res.json(await getSeriesInMyList(userId));
});

router.get("/myListMovies", async (req: any, res: any) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  return res.json(await getMoviesInMyList(userId));
});

router.get("/continueWatching", async (req: any, res: any) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  return res.json(await getContinueWatchingVideos(userId));
});

//#endregion

//#region DETAILS

router.get("/details/collection", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") {
    return res.status(400).json({ error: "Collection ID is required" });
  }

  const collectionInstance = await getCollectionById(id as string);

  if (!collectionInstance) {
    return res.status(404).json({ error: "Collection not found" });
  }

  const collection = collectionInstance.get({ plain: true });

  // Sort movies
  collection.movies?.sort((a: Movie, b: Movie) => {
    const orderA = a.CollectionMovie?.custom_order ?? Infinity;
    const orderB = b.CollectionMovie?.custom_order ?? Infinity;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return parseInt(a.year, 10) - parseInt(b.year, 10);
  });

  // Sort series
  collection.shows?.sort((a: Series, b: Series) => {
    const orderA = a.CollectionSeries?.custom_order ?? Infinity;
    const orderB = b.CollectionSeries?.custom_order ?? Infinity;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return parseInt(a.year, 10) - parseInt(b.year, 10);
  });

  // Sort albums
  collection.albums?.sort((a: Album, b: Album) => {
    const orderA = a.CollectionAlbum?.custom_order ?? Infinity;
    const orderB = b.CollectionAlbum?.custom_order ?? Infinity;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return parseInt(b.year ?? "0", 10) - parseInt(a.year ?? "0", 10);
  });

  return res.json(collection);
});

router.get("/details/series", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  return res.json(await getSeriesById(id as string));
});

router.get("/details/seriesBySeasonId", async (req: any, res: any) => {
  const { seasonId } = req.query;

  if (!seasonId || seasonId === "") return;

  const season = await getSeasonById(seasonId as string);

  if (!season) return;

  return res.json(await getSeriesById(season.seriesId));
});

router.get("/details/season", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  return res.json(await getSeasonById(id as string));
});

router.get("/details/episode", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  return res.json(await getEpisodeById(id as string));
});

router.get("/details/video", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  return res.json(await getVideoById(id as string));
});

router.get("/details/movie", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  return res.json(await getMovieById(id as string));
});

router.get("/details/album", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  return res.json(await getAlbumById(id as string));
});

router.get("/episode-video", async (req: any, res: any) => {
  const { episodeId } = req.query;

  if (!episodeId || episodeId === "") return;

  return res.json(await getVideoByEpisodeId(episodeId as string));
});

router.get("/movie-video", async (req: any, res: any) => {
  const { movieId } = req.query;

  if (!movieId || movieId === "") return;

  return res.json(await getVideoByMovieId(movieId as string));
});

//#endregion

// Search files in library
router.get("/library/search", async (req: any, res: any) => {
  const { libraryId } = req.query;

  const library = await getLibraryById(libraryId);

  if (!library) {
    return res
      .status(404)
      .json({ message: `Library with ID ${libraryId} not found.` });
  }

  await clearLibrary(libraryId, WebSocketManager.getInstance());

  FileSearch.scanFiles(
    { id: library.id },
    WebSocketManager.getInstance(),
    false
  );

  return res.json({});
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

// Get search videos results
router.get("/media/search", async (req: any, res: any) => {
  const { query } = req.query;

  if (typeof query !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const data = await Downloader.searchVideos(query, 20);
  return res.json(data);
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

  return res.json({ url });
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

  return res.json({ url });
});

// Get series background video
router.get("/seriesVideo", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  const series = await getSeriesById(id as string);

  if (!series) {
    return res.status(404).json({ error: "Series not found" });
  }

  const folder = FilesManager.getExternalPath(
    `resources/video/${series.libraryId}/`
  );

  const filename = Utils.getFileInFolder(folder, series.id);
  if (!filename) {
    return res.status(404).json({ error: "File not found" });
  }

  const basename = path.basename(filename);
  const url = `/media/video/${series.libraryId}/${basename}`;

  return res.json({ url });
});

// Get series background music
router.get("/seriesMusic", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  const series = await getSeriesById(id as string);

  if (!series) {
    return res.status(404).json({ error: "Series not found" });
  }

  const folder = FilesManager.getExternalPath(
    `resources/music/${series.libraryId}/`
  );

  const filename = Utils.getFileInFolder(folder, series.id);
  if (!filename) {
    return res.status(404).json({ error: "File not found" });
  }

  const basename = path.basename(filename);
  const url = `/media/music/${series.libraryId}/${basename}`;

  return res.json({ url });
});

// Get season background video
router.get("/seasonVideo", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  const season = await getSeasonById(id as string);

  if (!season) {
    return res.status(404).json({ error: "Season not found" });
  }

  const series = await getSeriesById(season.seriesId);

  if (!series) {
    return res.status(404).json({ error: "Series not found" });
  }

  const folder = FilesManager.getExternalPath(
    `resources/video/${series.libraryId}/`
  );

  const filename = Utils.getFileInFolder(folder, season.id);
  if (!filename) {
    return res.status(404).json({ error: "File not found" });
  }

  const basename = path.basename(filename);
  const url = `/media/video/${series.libraryId}/${basename}`;

  return res.json({ url });
});

// Get season background music
router.get("/seasonMusic", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  const season = await getSeasonById(id as string);

  if (!season) {
    return res.status(404).json({ error: "Season not found" });
  }

  const series = await getSeriesById(season.seriesId);

  if (!series) {
    return res.status(404).json({ error: "Series not found" });
  }

  const folder = FilesManager.getExternalPath(
    `resources/music/${series.libraryId}/`
  );

  const filename = Utils.getFileInFolder(folder, season.id);
  if (!filename) {
    return res.status(404).json({ error: "File not found" });
  }

  const basename = path.basename(filename);
  const url = `/media/music/${series.libraryId}/${basename}`;

  return res.json({ url });
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

    return res.json(lyricsData);
  } catch (error) {
    console.error("Error searching for lyrics:", error);
    return res.status(500).json({ error: "An internal error occurred" });
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

      if (!extrasPath) {
        return []; // There is no 'extras' folder in this path, return an empty array
      }

      // Read the contents of the 'extras' directory
      const files = await fs.readdir(extrasPath);

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

    return res.json(allExtras);
  } catch (error) {
    console.error("Error searching for music extras:", error);
    return res
      .status(500)
      .json({ error: "An internal error occurred while searching for extras" });
  }
});
//#endregion

/**
 * @route   GET /collection-items
 * @desc    Returns the number of items in a collection of a specific type and a specific library
 */
router.get("/collection-items", async (req: any, res: any) => {
  const { collectionId, libraryId, type } = req.query;

  if (!collectionId && !libraryId) {
    return res.status(400).json({ error: "At least 1 ID is required" });
  }

  if (!type) {
    return res.status(400).json({ error: "Type is required" });
  }

  if (collectionId) {
    const collection = await getCollectionById(collectionId as string);

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    if (type === "Movies") {
      return res.json(
        collection.movies
          ? collection.movies.map((movie) => movie.libraryId === libraryId)
              .length
          : 0
      );
    } else if (type === "Shows") {
      return res.json(
        collection.shows
          ? collection.shows.map((show) => show.libraryId === libraryId).length
          : 0
      );
    } else {
      return res.json(
        collection.albums
          ? collection.albums.map((album) => album.libraryId === libraryId)
              .length
          : 0
      );
    }
  }
});

router.get("/collection-images", async (req: any, res: any) => {
  const { collectionId, type } = req.query;

  if (!collectionId && !type) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const collection = await getCollectionById(collectionId as string);

  if (!collection) {
    return res.status(404).json({ error: "Collection not found" });
  }

  return res.json(await getCollectionImages(collection, type));
});

async function getCollectionImages(collection: Collection, type: string) {
  if (!collection) {
    return {
      images: [],
    };
  }

  let items: any[] = [];

  if (type === "Movies") {
    items = collection.movies || [];
  } else if (type === "Shows") {
    items = collection.shows || [];
  } else if (type === "Music") {
    items = collection.albums || [];
  }

  let posterPath: string | null = null;
  let backgroundPath: string | null = null;
  let baseFolder: string | null = null;

  // Get the folder of the first item (root folder of the collection in this library)
  if (items.length > 0 && items[0].folder) {
    baseFolder = items[0].folder ?? "";
    if (baseFolder !== null && existsSync(baseFolder)) {
      try {
        const filesInFolder = await fs.readdir(baseFolder);

        // Search poster.ext and background.ext
        for (const file of filesInFolder) {
          const fileNameWithoutExt = path.parse(file).name.toLowerCase();
          if (
            Utils.imageExtensions.includes(path.extname(file).toLowerCase())
          ) {
            if (fileNameWithoutExt === "poster") {
              posterPath = path.join(baseFolder, file);
            } else if (fileNameWithoutExt === "background") {
              backgroundPath = path.join(baseFolder, file);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading folder ${baseFolder}:`, error);
      }
    }
  }

  let imagePaths: string[] = [];

  // If no poster found, return the first 4 covers
  if (!posterPath && items) {
    imagePaths = items
      .map((item) => item.coverSrc)
      .filter(Boolean)
      .slice(0, 4);
  }

  return {
    poster: posterPath,
    background: backgroundPath,
    images: imagePaths,
  };
}

router.get("/music-metadata", async (req: any, res: any) => {
  const { file } = req.query;

  if (!file) {
    return res.status(400).json({ error: "File query parameter is required." });
  }

  try {
    // Decode the file path in case it's URL-encoded
    const decodedFile = decodeURIComponent(file);
    const metadata = await getAudioInfo(decodedFile);
    return res.json({ metadata });
  } catch (error: any) {
    console.error("FFprobe Error:", error.message);
    // Send a specific error message back to the client
    return res.status(500).json({
      message: "Failed to get media metadata.",
      error: error.message,
    });
  }
});

// Test endpoint to get chapters
router.get("/chapters", async (req: any, res: any) => {
  const path = req.query.path;

  if (!path) {
    return res.status(400).json({ error: "Path query parameter is required." });
  }

  return res.json(await getChapters(path));
});

// Test endpoint to get media info
router.get("/mediaInfo", async (req: any, res: any) => {
  const path = req.query.path;

  if (!path) {
    return res.status(400).json({ error: "Path query parameter is required." });
  }

  return res.json(await getMediaInfo(path));
});

export default router;
