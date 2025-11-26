import {
  fileSystemService,
  tmdbApiClient,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { DownloaderManager } from "@/managers/DownloaderManager";
import { SanitizationManager } from "@/managers/SanitizationManager";
import catchAsync from "@/utils/catchAsync";
import { upload } from "@/utils/multer";
import { downloadImage, isValidURL } from "@/utils/utils";
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
      propertiesReader(fileSystemService.propertiesFilePath) || undefined;

    // Save API key in properties file
    properties.set("TMDB_API_KEY", apiKey);
    properties.save(fileSystemService.propertiesFilePath);

    if (!apiKey) {
      return res.status(400).json({
        status: "INVALID_API_KEY",
      });
    }

    const moviedb = new MovieDb(String(apiKey));

    tmdbApiClient.THEMOVIEDB_API_TOKEN = apiKey;

    return res.status(200).json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  })
);

// Upload image
router.post(
  "/uploadImage",
  upload,
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const destPath = req.body.destPath;

    if (!destPath) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    try {
      const sanitizedDestPath = SanitizationManager.sanitizeDirectoryPath(
        destPath,
        SanitizationManager.getSystemAllowedPaths(),
        false
      );

      if (Array.isArray(req.files) || !req.files?.image) {
        return next(
          new ApiError(400, messages.errors.validation.noImageReceived)
        );
      }

      const file = req.files.image[0];

      // Validate file name
      if (!SanitizationManager.isValidFileName(file.originalname)) {
        return next(new ApiError(400, "Invalid file name"));
      }

      // Combine the paths
      const finalPath = SanitizationManager.safeJoinPath(
        sanitizedDestPath,
        file.originalname
      );

      res.status(200).send({
        status: "success",
        message: `Image uploaded successfully to ${finalPath}`,
      });
    } catch (error: any) {
      return next(new ApiError(400, `Invalid path: ${error.message}`));
    }
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

    if (!isValidURL(url)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    // If the file name doesn't have an extension, add .jpg
    if (!path.extname(fileName)) {
      fileName += ".jpg";
    }

    await downloadImage(
      url,
      path.join(fileSystemService.resourcesPath, downloadFolder, fileName)
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

    await DownloaderManager.downloadVideo(url, downloadFolder, fileName);

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

    await DownloaderManager.downloadAudio(url, downloadFolder, fileName);

    return res.status(200).json({ message: messages.success.download });
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

    const getSongById = useCases.getSongById();
    const song = await getSongById.execute(songId as string);

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
