import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";
import { promises as fs } from "fs";
import path from "path";
import { useCases } from "../../adapters/di/container";

const router = Router();

router.get(
  "/lyrics",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, "Query parameter 'id' is required."));
    }
    const lyrics = await MediaDetailsManager.findLyricsForSong(id);
    res.status(200).json(lyrics);
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
