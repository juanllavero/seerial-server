import {
  songsRepo,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import { NextFunction, Request, Response } from "express";
import { path } from "ffprobe-static";
import { DeleteSongUseCase } from "../../../application/usecases/DeleteSongUseCase";
import { UpdateSongUseCase } from "../../../application/usecases/UpdateSongUseCase";

export class SongsController {
  /**
   * @swagger
   * /songs/{id}:
   *   put:
   *     summary: Update a song
   *     tags: [Songs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Song ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 description: Song title
   *               artist:
   *                 type: string
   *                 description: Artist name
   *               album:
   *                 type: string
   *                 description: Album name
   *               duration:
   *                 type: number
   *                 description: Duration in seconds
   *               genre:
   *                 type: string
   *                 description: Music genre
   *               filePath:
   *                 type: string
   *                 description: File path
   *     responses:
   *       200:
   *         description: Song updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Song updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Song'
   *       400:
   *         description: Invalid song ID
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateSongUseCase(songsRepo);
      const result = await useCase.execute(id, req.body);

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /songs/{id}:
   *   delete:
   *     summary: Delete a song
   *     tags: [Songs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Song ID
   *     responses:
   *       200:
   *         description: Song deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Song deleted successfully
   *       400:
   *         description: Invalid song ID
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteSongUseCase(songsRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /songs/{id}/lyrics:
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
  static async getSongsLyrics(req: Request, res: Response, next: NextFunction) {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, "Query parameter 'id' is required."));
    }
    const lyrics = await MediaDetailsManager.findLyricsForSong(id);
    res.status(200).json(lyrics);
  }

  /**
   * @swagger
   * /songs/{id}/lyrics:
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
  static async addSongsLyrics(req: Request, res: Response, next: NextFunction) {
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
  }
}
