import {
  fileSystemService,
  songsRepo,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import { NextFunction, Request, Response } from "express";
import { DeleteSongUseCase } from "../../../application/usecases/DeleteSongUseCase";
import { UpdateSongUseCase } from "../../../application/usecases/UpdateSongUseCase";

export class SongsController {
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

  static async getSongsLyrics(req: Request, res: Response, next: NextFunction) {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, "Query parameter 'id' is required."));
    }
    const lyrics = await MediaDetailsManager.findLyricsForSong(id);
    res.status(200).json(lyrics);
  }

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

    const songDirectory = fileSystemService.dirname(song.fileSrc);
    const baseFilename = fileSystemService.basename(
      song.fileSrc,
      fileSystemService.extname(song.fileSrc)
    );

    // If original language, avoid adding the language code to the file name
    const languageSuffix =
      language.toLowerCase() === "original" || language === ""
        ? ""
        : `.${language}`;

    const finalFilename = `${baseFilename}${languageSuffix}.lrc`;
    const fullSavePath = fileSystemService.join(songDirectory, finalFilename);

    await fileSystemService.writeFile(fullSavePath, content, "utf-8");

    return res.status(201).json({
      message: "Lyrics file created successfully",
      path: fullSavePath,
    });
  }
}
