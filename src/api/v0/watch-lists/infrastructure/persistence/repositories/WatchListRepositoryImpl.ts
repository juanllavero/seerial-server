import { BaseRepository } from "@/api/v0/base-repository/BaseRepository";
import { v4 as uuidv4 } from "uuid";
import { WatchListRepositoryPort } from "../../../application/ports/WatchListRepositoryPort";
import { WatchList } from "../../../domain/WatchList";
import { WatchListModel } from "../models/WatchListModel";

export class WatchListRepositoryImpl
  extends BaseRepository
  implements WatchListRepositoryPort
{
  async findByVideoId(videoId: string): Promise<WatchList | null> {
    const validatedId = this.validateId(videoId, "Video ID");

    return this.handleRepositoryError(async () => {
      const watchlistItem = await WatchListModel.findOne({
        where: {
          videoId: validatedId,
        },
      });

      return watchlistItem ? watchlistItem.toJSON() : null;
    }, `Failed to retrieve watchList item with video ID ${validatedId}`);
  }

  async findById(id: string): Promise<WatchList | null> {
    const validatedId = this.validateId(id, "WatchList ID");

    return this.handleRepositoryError(async () => {
      const watchlistItem = await WatchListModel.findByPk(validatedId, {});

      return watchlistItem ? watchlistItem.toJSON() : null;
    }, `Failed to retrieve watchList item with ID ${validatedId}`);
  }

  async create(data: WatchList): Promise<WatchList> {
    this.validateData(data, "WatchList data");

    return this.handleRepositoryError(async () => {
      // If the record already exists for the same unique pair (e.g., videoId+userId), return it
      const where: any = { userId: data.userId };
      if (data.videoId) where.videoId = data.videoId;
      if (data.movieId) where.movieId = data.movieId;
      if (data.episodeId) where.episodeId = data.episodeId;
      if (data.seasonId) where.seasonId = data.seasonId;
      if (data.seriesId) where.seriesId = data.seriesId;

      const existing = await WatchListModel.findOne({ where });
      if (existing) return existing.toJSON();

      const dataToCreate = {
        ...data,
        id: data.id || uuidv4().split("-")[0],
      } as any;

      const created = await WatchListModel.create(dataToCreate);
      return created.toJSON();
    }, "Failed to create watchList item");
  }

  async update(id: string, data: Partial<WatchList>): Promise<WatchList> {
    const validatedId = this.validateId(id, "WatchList item ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const [affectedCount] = await WatchListModel.update(data as any, {
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `WatchList with ID ${id} not found`);

      const updatedWatchList = await this.findById(id);
      if (!updatedWatchList) {
        throw new Error(
          `Failed to retrieve updated watchlist item with ID ${id}`
        );
      }

      return updatedWatchList;
    }, `Failed to update watchlist item with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "WatchList item ID");

    await this.handleRepositoryError(async () => {
      const affectedCount = await WatchListModel.destroy({
        where: { id: validatedId },
      });

      this.ensureAffected(
        affectedCount,
        `WatchList item with ID ${id} not found`
      );
    }, `Failed to delete watchlist item with ID ${id}`);
  }

  async addSeries(userId: string, seriesId: string): Promise<void> {
    const { userId: uId, seriesId: sId } = this.validateIds({
      userId,
      seriesId,
    });

    await this.handleRepositoryError(async () => {
      const existing = await WatchListModel.findOne({
        where: { userId: uId, seriesId: sId },
      });
      if (existing) return;
      await WatchListModel.create({
        id: uuidv4().split("-")[0],
        userId: uId,
        seriesId: sId,
      } as any);
    }, `Failed to add series ${seriesId} to watchlist`);
  }

  async removeSeries(userId: string, seriesId: string): Promise<boolean> {
    const { userId: uId, seriesId: sId } = this.validateIds({
      userId: String(userId),
      seriesId: String(seriesId),
    });

    return this.handleRepositoryError(async () => {
      const affected = await WatchListModel.destroy({
        where: { userId: uId, seriesId: sId },
      });
      return affected > 0;
    }, `Failed to remove series ${seriesId} from watchlist`);
  }

  async addSeason(userId: string, seasonId: string): Promise<void> {
    const { userId: uId, seasonId: seId } = this.validateIds({
      userId,
      seasonId,
    });

    await this.handleRepositoryError(async () => {
      const existing = await WatchListModel.findOne({
        where: { userId: uId, seasonId: seId },
      });
      if (existing) return;
      await WatchListModel.create({
        id: uuidv4().split("-")[0],
        userId: uId,
        seasonId: seId,
      } as any);
    }, `Failed to add season ${seasonId} to watchlist`);
  }

  async removeSeason(userId: string, seasonId: string): Promise<boolean> {
    const { userId: uId, seasonId: seId } = this.validateIds({
      userId: String(userId),
      seasonId: String(seasonId),
    });

    return this.handleRepositoryError(async () => {
      const affected = await WatchListModel.destroy({
        where: { userId: uId, seasonId: seId },
      });
      return affected > 0;
    }, `Failed to remove season ${seasonId} from watchlist`);
  }

  async addEpisode(userId: string, episodeId: string): Promise<void> {
    const { userId: uId, episodeId: eId } = this.validateIds({
      userId,
      episodeId,
    });

    await this.handleRepositoryError(async () => {
      const existing = await WatchListModel.findOne({
        where: { userId: uId, episodeId: eId },
      });
      if (existing) return;
      await WatchListModel.create({
        id: uuidv4().split("-")[0],
        userId: uId,
        episodeId: eId,
      } as any);
    }, `Failed to add episode ${episodeId} to watchlist`);
  }

  async removeEpisode(userId: string, episodeId: string): Promise<boolean> {
    const { userId: uId, episodeId: eId } = this.validateIds({
      userId: String(userId),
      episodeId: String(episodeId),
    });

    return this.handleRepositoryError(async () => {
      const affected = await WatchListModel.destroy({
        where: { userId: uId, episodeId: eId },
      });
      return affected > 0;
    }, `Failed to remove episode ${episodeId} from watchlist`);
  }

  async addMovie(userId: string, movieId: string): Promise<void> {
    const { userId: uId, movieId: mId } = this.validateIds({ userId, movieId });

    await this.handleRepositoryError(async () => {
      const existing = await WatchListModel.findOne({
        where: { userId: uId, movieId: mId },
      });
      if (existing) return;
      await WatchListModel.create({
        id: uuidv4().split("-")[0],
        userId: uId,
        movieId: mId,
      } as any);
    }, `Failed to add movie ${movieId} to watchlist`);
  }

  async removeMovie(userId: string, movieId: string): Promise<boolean> {
    const { userId: uId, movieId: mId } = this.validateIds({
      userId: String(userId),
      movieId: String(movieId),
    });

    return this.handleRepositoryError(async () => {
      const affected = await WatchListModel.destroy({
        where: { userId: uId, movieId: mId },
      });
      return affected > 0;
    }, `Failed to remove movie ${movieId} from watchlist`);
  }

  async addVideo(userId: string, videoId: string): Promise<void> {
    const { userId: uId, videoId: vId } = this.validateIds({ userId, videoId });

    await this.handleRepositoryError(async () => {
      const existing = await WatchListModel.findOne({
        where: { userId: uId, videoId: vId },
      });
      if (existing) return;
      await WatchListModel.create({
        id: uuidv4().split("-")[0],
        userId: uId,
        videoId: vId,
      } as any);
    }, `Failed to add video ${videoId} to watchlist`);
  }

  async removeVideo(userId: string, videoId: string): Promise<boolean> {
    const { userId: uId, videoId: vId } = this.validateIds({
      userId: String(userId),
      videoId: String(videoId),
    });

    return this.handleRepositoryError(async () => {
      const affected = await WatchListModel.destroy({
        where: { userId: uId, videoId: vId },
      });
      return affected > 0;
    }, `Failed to remove video ${videoId} from watchlist`);
  }

  async isVideoWatched(videoId: string, userId: string): Promise<boolean> {
    const { userId: uId, videoId: vId } = this.validateIds({
      userId: String(userId),
      videoId: String(videoId),
    });

    return this.handleRepositoryError(async () => {
      const existing = await WatchListModel.findOne({
        where: { userId: uId, videoId: vId },
      });
      return existing !== null;
    }, `Failed to check if video ${videoId} is watched by user ${userId}`);
  }

  async isSeriesWatched(seriesId: string, userId: string): Promise<boolean> {
    const { userId: uId, seriesId: sId } = this.validateIds({
      userId: String(userId),
      seriesId: String(seriesId),
    });

    return this.handleRepositoryError(async () => {
      const existing = await WatchListModel.findOne({
        where: { userId: uId, seriesId: sId },
      });
      return existing !== null;
    }, `Failed to check if series ${seriesId} is watched by user ${userId}`);
  }

  async isMovieWatched(movieId: string, userId: string): Promise<boolean> {
    const { userId: uId, movieId: mId } = this.validateIds({
      userId: String(userId),
      movieId: String(movieId),
    });

    return this.handleRepositoryError(async () => {
      const existing = await WatchListModel.findOne({
        where: { userId: uId, movieId: mId },
      });
      return existing !== null;
    }, `Failed to check if movie ${movieId} is watched by user ${userId}`);
  }

  async isSeasonWatched(seasonId: string, userId: string): Promise<boolean> {
    const { userId: uId, seasonId: sId } = this.validateIds({
      userId: String(userId),
      seasonId: String(seasonId),
    });

    return this.handleRepositoryError(async () => {
      const existing = await WatchListModel.findOne({
        where: { userId: uId, seasonId: sId },
      });
      return existing !== null;
    }, `Failed to check if season ${seasonId} is watched by user ${userId}`);
  }
}
