import express from "express";
import { promises as fs } from "fs";
import { MovieDb } from "moviedb-promise";
import path from "path";
import propertiesReader from "properties-reader";
import {
  Album,
  CollectionAlbum,
  CollectionMovie,
  CollectionSeries,
  Library,
  LibraryCollection,
  Movie,
  Series,
} from "../../data/models";
import {
  getEpisodeById,
  getMovieById,
  getMovieFromMyList,
  getSeasonById,
  getSeriesById,
  getSeriesFromMyList,
  getSongById,
  getVideoByEpisodeId,
  getVideoById,
} from "../../db/get/getData";
import {
  addMovieToMyList,
  addSeriesToMyList,
  removeMovieFromMyList,
  removeSeriesFromMyList,
} from "../../db/post/postData";
import { SequelizeManager } from "../../db/SequelizeManager";
import { Downloader } from "../../downloaders/Downloader";
import { FileSearch } from "../../fileSearch/FileSearch";
import {
  updateMovieMetadata,
  updateShowMetadata,
} from "../../fileSearch/updateMetadata";
import { wsManager } from "../../index";
import { MovieDBWrapper } from "../../theMovieDB/MovieDB";
import { FilesManager } from "../../utils/FilesManager";
import { Utils } from "../../utils/Utils";
const router = express.Router();

router.post("/api-key", (req: any, res: any) => {
  const { apiKey } = req.body;

  const properties =
    propertiesReader(FilesManager.propertiesFilePath) || undefined;

  // Save API key in properties file
  properties.set("TMDB_API_KEY", apiKey);
  properties.save(FilesManager.propertiesFilePath);

  if (apiKey) {
    const moviedb = new MovieDb(String(apiKey));

    MovieDBWrapper.THEMOVIEDB_API_TOKEN = apiKey;

    res.json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  } else {
    res.json({
      status: "INVALID_API_KEY",
    });
  }
});

// Add library
router.post("/addLibrary", async (req: any, res: any) => {
  const libraryData = req.body;

  const library = await FileSearch.scanFiles(libraryData, wsManager, true);

  return res.status(200).json(library);
});

// Reorder libraries
router.post("/libraries/reorder", async (req: any, res: any) => {
  const { orderedLibraryIds } = req.body;

  if (!Array.isArray(orderedLibraryIds)) {
    return res.status(400).json({ error: "Se requiere un array de IDs" });
  }

  if (!SequelizeManager.sequelize) {
    return res.status(500).json({ error: "Sequelize no está inicializado" });
  }

  const t = await SequelizeManager.sequelize.transaction();

  try {
    await Library.update(
      { order: 9999 },
      {
        where: {},
        transaction: t,
      }
    );

    for (const [index, libraryId] of orderedLibraryIds.entries()) {
      const newOrder = index;

      await Library.update(
        { order: newOrder },
        {
          where: { id: libraryId },
          transaction: t,
        }
      );
    }

    await t.commit();
    res.status(200).json({ message: "Bibliotecas reordenadas correctamente" });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({ error: "Error interno al reordenar las bibliotecas" });
  }
});

// Reorder library
router.post("/library/reorder", async (req: any, res: any) => {
  const { libraryId, orderedItems } = req.body;

  if (!libraryId || !Array.isArray(orderedItems)) {
    return res.status(400).json({ error: "Invalid data" });
  }

  if (!SequelizeManager.sequelize) {
    return res.status(500).json({ error: "Sequelize not initialized" });
  }

  const t = await SequelizeManager.sequelize.transaction();

  try {
    const tempOrder = 9999;

    // Get the library
    const library = await Library.findByPk(libraryId);
    if (!library) {
      await t.rollback();
      return res.status(404).json({ error: "Library not found" });
    }

    // Restore the order of the collections
    await LibraryCollection.update(
      { customOrder: tempOrder },
      { where: { libraryId: libraryId }, transaction: t }
    );

    // Restore the order of the items
    if (library.type === "Movies") {
      await Movie.update(
        { order: tempOrder },
        { where: { libraryId: libraryId }, transaction: t }
      );
    } else if (library.type === "Shows") {
      await Series.update(
        { order: tempOrder },
        { where: { libraryId: libraryId }, transaction: t }
      );
    } else if (library.type === "Music") {
      await Album.update(
        { order: tempOrder },
        { where: { libraryId: libraryId }, transaction: t }
      );
    }

    // Assign the new order to the items
    for (let i = 0; i < orderedItems.length; i++) {
      const item = orderedItems[i];
      const newOrder = i;

      if (item.type === "collection") {
        await LibraryCollection.update(
          { customOrder: newOrder },
          {
            where: { libraryId: libraryId, collectionId: item.id },
            transaction: t,
          }
        );
      } else if (item.type === "movies") {
        await Movie.update(
          { order: newOrder },
          { where: { libraryId: libraryId, id: item.id }, transaction: t }
        );
      } else if (item.type === "shows") {
        await Series.update(
          { order: newOrder },
          { where: { libraryId: libraryId, id: item.id }, transaction: t }
        );
      } else if (item.type === "albums") {
        await Album.update(
          { order: newOrder },
          { where: { libraryId: libraryId, id: item.id }, transaction: t }
        );
      }
    }

    await t.commit();
    res.status(200).json({ message: "Order updated successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Error reordering:", error);
    res.status(500).json({ error: "Error updating order" });
  }
});

router.post("/collections/reorder-content", async (req: any, res: any) => {
  const { collectionId, orderedItems } = req.body;

  if (!collectionId || !Array.isArray(orderedItems)) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  if (!SequelizeManager.sequelize) {
    return res.status(500).json({ error: "Sequelize no inicializado" });
  }

  const t = await SequelizeManager.sequelize.transaction();

  try {
    const tempOrder = 9999;

    // Restore the order of the items
    await CollectionMovie.update(
      { customOrder: tempOrder },
      { where: { collectionId }, transaction: t }
    );
    await CollectionSeries.update(
      { customOrder: tempOrder },
      { where: { collectionId }, transaction: t }
    );
    await CollectionAlbum.update(
      { customOrder: tempOrder },
      { where: { collectionId }, transaction: t }
    );

    // Assign the new order to the items
    for (const [index, item] of orderedItems.entries()) {
      const newOrder = index;

      switch (item.type) {
        case "movie":
        case "movies":
          await CollectionMovie.update(
            { customOrder: newOrder },
            {
              where: { collectionId, movieId: item.id },
              transaction: t,
            }
          );
          break;
        case "series":
        case "show":
        case "shows":
          await CollectionSeries.update(
            { customOrder: newOrder },
            {
              where: { collectionId, seriesId: item.id },
              transaction: t,
            }
          );
          break;
        case "album":
        case "albums":
          await CollectionAlbum.update(
            { customOrder: newOrder },
            {
              where: { collectionId, albumId: item.id },
              transaction: t,
            }
          );
          break;
      }
    }

    await t.commit();
    res.status(200).json({ message: "Orden de la colección actualizado" });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: "Error interno al actualizar el orden" });
  }
});

// Upload image
router.post("/uploadImage", FilesManager.upload, (req: any, res: any) => {
  const file = req.files?.image?.[0];
  const destPath = req.body.destPath;

  if (!file) {
    return res.status(400).send("No file received");
  }

  if (!destPath) {
    return res.status(400).send("Destination path not specified");
  }

  res
    .status(200)
    .send(
      `Image uploaded successfully to ${path.join(destPath, file.originalname)}`
    );
});

// Download image
router.post("/downloadImage", async (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  if (!Utils.isValidURL(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    await Utils.downloadImage(
      url,
      path.join(FilesManager.resourcesPath, downloadFolder, fileName)
    );
  } catch (error) {
    return res.status(400).json({ error: "Error downloading image" });
  }

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Download video
router.post("/downloadVideo", async (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  await Downloader.downloadVideo(url, downloadFolder, fileName, wsManager);

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Download music
router.post("/downloadMusic", (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  Downloader.downloadAudio(url, downloadFolder, fileName, wsManager);

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Update TheMovieDB id for show
router.post("/updateShowId", (req: any, res: any) => {
  const { showId, themdbId } = req.body;

  if (!showId || !themdbId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  updateShowMetadata(showId, themdbId, wsManager);

  res.json({ message: "UPDATE_FINISHED" });
});

// Update TheMovieDB id for movie
router.post("/updateMovieId", (req: any, res: any) => {
  const { movieId, themdbId } = req.body;

  if (!movieId || !themdbId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  updateMovieMetadata(movieId, themdbId, wsManager);

  res.json({ message: "UPDATE_FINISHED" });
});

// Update episode group for show
router.post("/updateEpisodeGroup", (req: any, res: any) => {
  const { showId, themdbId, episodeGroupId } = req.body;

  if (!showId || !themdbId || !episodeGroupId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  updateShowMetadata(showId, themdbId, wsManager, episodeGroupId);
});

// Set movie watched state
router.post("/setMovieWatched", async (req: any, res: any) => {
  const { movieId, watched } = req.body;

  if (!movieId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const movie = await getMovieById(movieId);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  movie.watched = watched;
  await movie.save();

  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set video watched state
router.post("/setVideoWatched", async (req: any, res: any) => {
  const { videoId, watched } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }

  video.watched = watched;
  await video.save();

  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set show watched state
router.post("/setSeriesWatched", async (req: any, res: any) => {
  const { seriesId, watched } = req.body;

  if (!seriesId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const series = await getSeriesById(seriesId);

  if (!series) {
    return res.status(404).json({ error: "Series not found" });
  }

  for (const season of series.seasons) {
    const seasonWithEpisodes = await getSeasonById(season.id);

    if (!seasonWithEpisodes) continue;

    for (const episode of seasonWithEpisodes.episodes) {
      const episodeDB = await getEpisodeById(episode.id);

      if (!episodeDB) continue;

      const video = await getVideoByEpisodeId(episodeDB.id);

      if (!video) continue;

      video.watched = watched;
      video.lastWatched = "";
      video.timeWatched = 0;
      await video.save();
    }

    seasonWithEpisodes.watched = watched;
    await seasonWithEpisodes.save();
  }

  series.watched = watched;
  series.currentlyWatchingEpisodeId = "";
  await series.save();

  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set season watched state
router.post("/setSeasonWatched", async (req: any, res: any) => {
  const { seasonId, watched } = req.body;

  if (!seasonId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const season = await getSeasonById(seasonId);

  if (!season) {
    return res.status(404).json({ error: "Season not found" });
  }

  // Get first or last episode
  const episodeIndex = watched === true ? season.episodes.length - 1 : 0;

  const episode = season.episodes.sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  )[episodeIndex];

  // Set episode watched state
  await Utils.setEpisodeWatchState(season, episode, watched);

  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set episode watched state
router.post("/setEpisodeWatched", async (req: any, res: any) => {
  const { episodeId, watched } = req.body;

  if (!episodeId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const episode = await getEpisodeById(episodeId);

  if (!episode) {
    return res.status(404).json({ error: "Episode not found" });
  }

  const season = await getSeasonById(episode.seasonId);

  if (!season) {
    return res.status(404).json({ error: "Season not found" });
  }

  await Utils.setEpisodeWatchState(season, episode, watched);

  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Add/remove series from My List
router.post("/updateSeriesMyList", async (req: any, res: any) => {
  const { seriesId } = req.body;

  if (!seriesId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  if (await getSeriesFromMyList(seriesId)) {
    await removeSeriesFromMyList(seriesId);
  } else {
    await addSeriesToMyList(seriesId);
  }

  res.json({ message: "MY_LIST_UPDATED" });
});

// Add/remove movie from My List
router.post("/updateMovieMyList", async (req: any, res: any) => {
  const { movieId } = req.body;

  if (!movieId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  if (await getMovieFromMyList(movieId)) {
    await removeMovieFromMyList(movieId);
  } else {
    await addMovieToMyList(movieId);
  }

  res.json({ message: "MY_LIST_UPDATED" });
});

/**
 * Creates a new .lrc file for a given song.
 * Expects { songId: string, language: string, content: string } in the request body.
 */
router.post("/lyrics", async (req: any, res: any) => {
  const { songId, language, content } = req.body;

  if (!songId || !language || !content) {
    return res.status(400).json({
      error: "Missing required fields. Required: songId, language, content.",
    });
  }

  try {
    const song = await getSongById(songId as string);

    if (!song) {
      return res
        .status(404)
        .json({ error: `Song with id ${songId} not found` });
    }

    const songDirectory = path.dirname(song.fileSrc);
    const baseFilename = path.basename(
      song.fileSrc,
      path.extname(song.fileSrc)
    );

    // If original language, avoid adding the language code to the file name
    const languageSuffix =
      language.toLowerCase() === "original" || language === ""
        ? ""
        : `.${language}`;

    const finalFilename = `${baseFilename}${languageSuffix}.lrc`;
    const fullSavePath = path.join(songDirectory, finalFilename);

    await fs.writeFile(fullSavePath, content, "utf-8");

    return res.status(201).json({
      message: "Lyrics file created successfully",
      path: fullSavePath,
    });
  } catch (error) {
    console.error("Error creating LRC file:", error);
    return res.status(500).json({
      error: "An internal server error occurred while trying to save the file.",
    });
  }
});

export default router;
