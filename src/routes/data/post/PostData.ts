import { messages } from "@/config/messages";
import {
  Album,
  CollectionAlbum,
  CollectionMovie,
  CollectionSeries,
  Library,
  LibraryCollection,
  Movie,
  Series,
} from "@/data/models";
import { getSongById } from "@/db/get/getData";
import { FileSearch } from "@/fileSearch/FileSearch";
import {
  changeIdentificationMovie,
  changeIdentificationShow,
} from "@/fileSearch/utils/changeIdentification";
import {
  refreshMovieMetadata,
  refreshSeriesMetadata,
} from "@/fileSearch/utils/refreshMetadata";
import { wsManager } from "@/index";
import { DownloaderManager } from "@/managers/DownloaderManager";
import { FilesManager } from "@/managers/FilesManager";
import { SequelizeManager } from "@/managers/SequelizeManager";
import { MovieDBWrapper } from "@/theMovieDB/MovieDB";
import ApiError from "@/utils/ApiError";
import catchAsync from "@/utils/catchAsync";
import { Utils } from "@/utils/Utils";
import express, { NextFunction, Request, Response } from "express";
import { promises as fs } from "fs";
import { MovieDb } from "moviedb-promise";
import path from "path";
import propertiesReader from "properties-reader";

const router = express.Router();

router.post(
  "/api-key",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { apiKey } = req.body;

    const properties =
      propertiesReader(FilesManager.propertiesFilePath) || undefined;

    // Save API key in properties file
    properties.set("TMDB_API_KEY", apiKey);
    properties.save(FilesManager.propertiesFilePath);

    if (!apiKey) {
      return res.status(400).json({
        status: "INVALID_API_KEY",
      });
    }

    const moviedb = new MovieDb(String(apiKey));

    MovieDBWrapper.THEMOVIEDB_API_TOKEN = apiKey;

    return res.status(200).json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  })
);

// Add library
router.post(
  "/addLibrary",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const libraryData = req.body;
    const library = await FileSearch.scanFiles(libraryData, wsManager, true);

    if (!library) {
      return next(new ApiError(404, messages.errors.create));
    }

    return res.status(200).json(library);
  })
);

// Reorder libraries
router.post(
  "/libraries/reorder",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { orderedLibraryIds } = req.body;

    if (!Array.isArray(orderedLibraryIds)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    if (!SequelizeManager.sequelize) {
      return next(new ApiError(500, messages.errors.server.dbInit));
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
      return res.status(200).json({ message: messages.success.order });
    } catch (error) {
      await t.rollback();
      return next(new ApiError(500, messages.errors.order));
    }
  })
);

// Reorder library
router.post(
  "/library/reorder",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId, orderedItems } = req.body;

    if (!libraryId || !Array.isArray(orderedItems)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    if (!SequelizeManager.sequelize) {
      return next(new ApiError(500, messages.errors.server.dbInit));
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
      return res.status(200).json({ message: messages.success.order });
    } catch (error) {
      await t.rollback();
      return next(new ApiError(500, messages.errors.order));
    }
  })
);

router.post(
  "/collections/reorder-content",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { collectionId, orderedItems } = req.body;

    if (!collectionId || !Array.isArray(orderedItems)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    if (!SequelizeManager.sequelize) {
      return next(new ApiError(500, messages.errors.server.dbInit));
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
      return res.status(200).json({ message: messages.success.order });
    } catch (error) {
      await t.rollback();
      return next(new ApiError(500, messages.errors.order));
    }
  })
);

// Upload image
router.post(
  "/uploadImage",
  FilesManager.upload,
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const destPath = req.body.destPath;

    if (!destPath) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    if (Array.isArray(req.files) || !req.files?.image) {
      return next(
        new ApiError(400, messages.errors.validation.noImageReceived)
      );
    }

    const file = req.files.image[0];

    res.status(200).send({
      status: "success",
      message: `Image uploaded successfully to ${path.join(
        destPath,
        file.originalname
      )}`,
    });
  })
);

// Download image
router.post(
  "/downloadImage",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let { url, downloadFolder, fileName } = req.body;

    if (!url || !downloadFolder || !fileName) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    if (!Utils.isValidURL(url)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    // If the file name doesn't have an extension, add .jpg
    if (!path.extname(fileName)) {
      fileName += ".jpg";
    }

    await Utils.downloadImage(
      url,
      path.join(FilesManager.resourcesPath, downloadFolder, fileName)
    );

    return res.status(200).json({ message: messages.success.download });
  })
);

// Download video
router.post(
  "/downloadVideo",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { url, downloadFolder, fileName } = req.body;

    if (!url || !downloadFolder || !fileName) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    await DownloaderManager.downloadVideo(
      url,
      downloadFolder,
      fileName,
      wsManager
    );

    return res.status(200).json({ message: messages.success.download });
  })
);

// Download music
router.post(
  "/downloadMusic",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { url, downloadFolder, fileName } = req.body;

    if (!url || !downloadFolder || !fileName) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    await DownloaderManager.downloadAudio(
      url,
      downloadFolder,
      fileName,
      wsManager
    );

    return res.status(200).json({ message: messages.success.download });
  })
);

// Refresh metadata for show
router.post(
  "/refreshShowMetadata",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.body;

    if (!id) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    refreshSeriesMetadata(id, wsManager);
    return res.status(200).json({ message: messages.success.update });
  })
);

// Refresh metadata for movie
router.post(
  "/refreshMovieMetadata",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.body;

    if (!id) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    refreshMovieMetadata(id, wsManager);
    return res.status(200).json({ message: messages.success.update });
  })
);

// Update TheMovieDB id for show
router.post(
  "/updateShowId",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, themdbId } = req.body;

    if (!id || !themdbId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    changeIdentificationShow(id, themdbId, wsManager);

    return res.status(200).json({ message: messages.success.update });
  })
);

// Update TheMovieDB id for movie
router.post(
  "/updateMovieId",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, themdbId } = req.body;

    if (!id || !themdbId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    changeIdentificationMovie(id, themdbId, wsManager);
    return res.status(200).json({ message: messages.success.update });
  })
);

// Update episode group for show
router.post(
  "/updateEpisodeGroup",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, themdbId, episodeGroupId } = req.body;

    if (!id || !themdbId || !episodeGroupId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    changeIdentificationShow(id, themdbId, wsManager, episodeGroupId);
    return res.status(200).json({ message: messages.success.update });
  })
);

/**
 * Creates a new .lrc file for a given song.
 * Expects { songId: string, language: string, content: string } in the request body.
 */
router.post(
  "/lyrics",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { songId, language, content } = req.body;

    if (!songId || !language || !content) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const song = await getSongById(songId as string);

    if (!song) {
      return next(new ApiError(404, messages.errors.notFound.song));
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
  })
);

export default router;
