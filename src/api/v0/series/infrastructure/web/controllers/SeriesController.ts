import {
  seriesRepo,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteSeriesUseCase } from "../../../application/usecases/DeleteSeriesUseCase";
import { UpdateEpisodeGroupUseCase } from "../../../application/usecases/UpdateEpisodeGroupUseCase";
import { UpdateSeriesUseCase } from "../../../application/usecases/UpdateSeriesUseCase";
import { UpdateShowIdUseCase } from "../../../application/usecases/UpdateShowIdUseCase";

export class SeriesController {
  static async refreshMetadata(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.body;

      if (!id) {
        return next(
          new ApiError(400, messages.errors.validation.notEnoughParams)
        );
      }

      const useCase = useCases.refreshMetadata();
      useCase.execute(id);
      res.status(200).json({
        status: "success",
        message: messages.success.update,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateShowId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, themdbId } = req.body;

      if (!id || !themdbId) {
        return next(
          new ApiError(400, messages.errors.validation.notEnoughParams)
        );
      }

      const useCase = new UpdateShowIdUseCase();
      useCase.execute(id, themdbId);
      res.status(200).json({
        status: "success",
        message: messages.success.update,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateEpisodeGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, themdbId, episodeGroupId } = req.body;

      if (!id || !themdbId || !episodeGroupId) {
        return next(
          new ApiError(400, messages.errors.validation.notEnoughParams)
        );
      }

      const useCase = new UpdateEpisodeGroupUseCase();
      useCase.execute(id, themdbId, episodeGroupId);
      res.status(200).json({
        status: "success",
        message: messages.success.update,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateSeriesUseCase(seriesRepo);
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

      const useCase = new DeleteSeriesUseCase(seriesRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }

  static async setWatchState(req: Request, res: Response, next: NextFunction) {
    const { id: seriesId } = req.params;
    const { watched, userId } = req.body;

    if (!seriesId || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const series = await useCases.getSeriesById().execute(seriesId);

    if (!series) {
      return next(new ApiError(404, messages.errors.notFound.series));
    }

    for (const season of series.seasons) {
      const seasonWithEpisodes = await useCases
        .getSeasonById()
        .execute(season.id);

      if (!seasonWithEpisodes) continue;

      for (const episode of seasonWithEpisodes.episodes) {
        const episodeDB = await useCases.getEpisodeById().execute(episode.id);

        if (!episodeDB) continue;

        const video = await useCases
          .getVideoByEpisodeId()
          .execute(episodeDB.id);

        if (!video) continue;

        if (watched) {
          await useCases.addVideoToWatchList().execute(video.id, userId);
        } else {
          await useCases.removeVideoFromWatchList().execute(video.id, userId);
        }
        await useCases.updateVideo().execute(video.id, video);

        // Manage continue watching
        if (watched === true) {
          await useCases
            .removeVideoFromContinueWatching()
            .execute(video.id, userId);
        }
      }

      if (watched) {
        await useCases
          .addSeasonToWatchList()
          .execute(seasonWithEpisodes.id, userId);
      } else {
        await useCases
          .removeSeasonFromWatchList()
          .execute(seasonWithEpisodes.id, userId);
      }
      await useCases
        .updateSeason()
        .execute(seasonWithEpisodes.id, seasonWithEpisodes);
    }

    if (watched) {
      await useCases.addSeriesToWatchList().execute(seriesId, userId);
    } else {
      await useCases.removeSeriesFromWatchList().execute(seriesId, userId);
    }
    await useCases.updateSeries().execute(series.id, series);

    return res.status(200).json({ message: messages.success.update });
  }
}
