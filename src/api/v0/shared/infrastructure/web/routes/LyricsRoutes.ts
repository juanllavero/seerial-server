import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";
import { promises as fs } from "fs";
import path from "path";
import { useCases } from "../../adapters/di/container";

const router = Router();

/**
 * @swagger
 * /lyrics:
 *   get:
 *     summary: Get lyrics for a song
 *     tags: [Lyrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Song ID
 *     responses:
 *       200:
 *         description: Lyrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lyrics:
 *                   type: string
 *                   description: Lyrics content
 *                 language:
 *                   type: string
 *                   description: Language of the lyrics
 *                 synced:
 *                   type: boolean
 *                   description: Whether the lyrics are synchronized
 *       400:
 *         description: Missing song ID parameter
 *       404:
 *         description: Song or lyrics not found
 *       500:
 *         description: Lyrics retrieval failed
 */
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
 * @swagger
 * /lyrics:
 *   post:
 *     summary: Create a new lyrics file for a song
 *     tags: [Lyrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - songId
 *               - language
 *               - content
 *             properties:
 *               songId:
 *                 type: string
 *                 description: ID of the song to add lyrics to
 *               language:
 *                 type: string
 *                 description: Language code for the lyrics (use "original" for no suffix)
 *                 example: "en"
 *               content:
 *                 type: string
 *                 description: Lyrics content in LRC format
 *                 example: "[00:12.00]Lyrics line one\n[00:15.30]Lyrics line two"
 *     responses:
 *       201:
 *         description: Lyrics file created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lyrics file created successfully"
 *                 path:
 *                   type: string
 *                   description: Full path where the lyrics file was saved
 *                   example: "/path/to/song.en.lrc"
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Song not found
 *       500:
 *         description: File creation failed
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
