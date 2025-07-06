import express from "express";
import * as fs from "fs/promises";
import path from "path";
import {
  getAlbumById,
  getAlbums,
  getCollectionById,
  getCollectionsInLibrary,
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
import { getAudioInfo } from "../../../ffmpeg/audioInfo";
import { getChapters, getMediaInfo } from "../../../ffmpeg/mediaInfo";
import { FileSearch } from "../../../fileSearch/FileSearch";
import { clearLibrary } from "../../../fileSearch/utils";
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

  console.log("--- Iniciando Petición a /library-content ---");
  console.log(`Query Params: libraryId=${libraryId}, type=${type}`);

  if (!libraryId || libraryId === "") {
    console.error("Error: Falta libraryId.");
    return res.status(400).json({ error: "Library ID is required" });
  }

  try {
    // Determina qué función usar según el tipo
    let getItemsFunction;
    let itemsKey: "movies" | "series" | "albums";
    let collectionItemsKey: "movies" | "shows" | "albums";

    if (type === "Movies") {
      getItemsFunction = getMovies;
      itemsKey = "movies";
      collectionItemsKey = "movies";
    } else if (type === "Shows") {
      getItemsFunction = getSeries;
      itemsKey = "series";
      collectionItemsKey = "shows";
    } else {
      getItemsFunction = getAlbums;
      itemsKey = "albums";
      collectionItemsKey = "albums";
    }
    console.log(
      `Función seleccionada: ${getItemsFunction.name}, Clave de items: ${itemsKey}`
    );

    // Ejecuta ambas funciones en paralelo
    const [collectionsWithContent, allItems] = await Promise.all([
      getCollectionsInLibrary(libraryId as string),
      getItemsFunction(libraryId as string),
    ]);

    console.log("--- Resultados de las Promesas ---");
    console.log(
      `Colecciones encontradas: ${collectionsWithContent?.length || 0}`
    );
    // Descomenta la siguiente línea para ver el contenido completo de las colecciones
    // console.log("Contenido de colecciones:", JSON.stringify(collectionsWithContent, null, 2));

    console.log(
      `Total de items encontrados (antes de filtrar): ${allItems?.length || 0}`
    );
    // Descomenta la siguiente línea para ver todos los items
    // console.log("Todos los items:", JSON.stringify(allItems, null, 2));

    if (!collectionsWithContent || !allItems) {
      console.error("Error: Fallo al obtener colecciones o items.");
      return res.status(500).json({ error: "Failed to fetch library content" });
    }

    // Crea un Set con los IDs de los items en las colecciones
    const itemIdsInCollections = new Set<string>();
    for (const collection of collectionsWithContent) {
      const items = (collection.get(collectionItemsKey) as any[]) || [];
      for (const item of items) {
        // Asegúrate de que 'item' y 'item.id' existen antes de añadirlos
        if (item && item.id) {
          itemIdsInCollections.add(item.id);
        }
      }
    }

    console.log("--- Filtrado de Items ---");
    console.log(
      `Total de IDs de items DENTRO de colecciones: ${itemIdsInCollections.size}`
    );
    console.log("IDs en colecciones:", Array.from(itemIdsInCollections));

    // Filtra los items que ya están en las colecciones
    const itemsNotInCollections = allItems.filter(
      (item) => !itemIdsInCollections.has(item.id)
    );

    console.log(
      `Items restantes (FUERA de colecciones): ${itemsNotInCollections.length}`
    );
    // Descomenta la siguiente línea para ver los items filtrados
    // console.log("Items fuera de colecciones:", JSON.stringify(itemsNotInCollections, null, 2));

    // Obtiene la información básica de la colección
    const cleanCollections = collectionsWithContent.map((collection) => {
      const { movies, shows, albums, ...collectionData } = collection.get({
        plain: true,
      });
      return collectionData;
    });

    // Devuelve los items que no están en las colecciones, junto con las colecciones
    const response = {
      collections: cleanCollections,
      [itemsKey]: itemsNotInCollections, // Los items que no están en ninguna colección
    };

    console.log({
      collections: cleanCollections.length,
      [itemsKey]: itemsNotInCollections.length,
    });

    return res.json(response);
  } catch (error) {
    console.error("Error catastrófico en /library-content:", error);
    return res.status(500).json({ error: "Failed to fetch library content" });
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
  return res.json(await getSeriesInMyList());
});

router.get("/myListMovies", async (req: any, res: any) => {
  return res.json(await getMoviesInMyList());
});

router.get("/continueWatching", async (req: any, res: any) => {
  return res.json(await getContinueWatchingVideos());
});

//#endregion

//#region DETAILS

router.get("/details/collection", async (req: any, res: any) => {
  const { id } = req.query;

  if (!id || id === "") return;

  return res.json(await getCollectionById(id as string));
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

  if (!library) return;

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

  const folder = FilesManager.getExternalPath(
    `resources/music/${season.series.libraryId}/`
  );

  const filename = Utils.getFileInFolder(folder, season.id);
  if (!filename) {
    return res.status(404).json({ error: "File not found" });
  }

  const basename = path.basename(filename);
  const url = `/media/music/${season.series.libraryId}/${basename}`;

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

  let items: any[] = [];

  if (type === "Movies") {
    items = collection.movies || [];
  } else if (type === "Shows") {
    items = collection.shows || [];
  } else if (type === "Music") {
    items = collection.albums || [];
  } else {
    return res.status(400).json({ error: "Invalid type" });
  }

  const imagePaths = items
    .map((item) => item.coverSrc)
    .filter(Boolean)
    .slice(0, 4);

  return res.json(imagePaths);
});

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

    return res.json({ hasDolbyAtmos });
  } else if (albumId) {
    const album = await getAlbumById(albumId as string);

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    const song = album.songs.find((song) => song.hasDolbyAtmos);

    if (song) {
      return res.json({ hasDolbyAtmos: true });
    } else {
      return res.json({ hasDolbyAtmos: false });
    }
  }

  return res.json({ hasDolbyAtmos: false });
});

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
