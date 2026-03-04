import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
import { v4 as uuidv4 } from "uuid";
import { WatchListRepositoryPort } from "../../../application/ports/WatchListRepositoryPort";
import { WatchList } from "../../../domain/WatchList";
import { WatchListModel } from "../models/WatchListModel";

export class WatchListRepositoryImpl
  extends BaseRepository
  implements WatchListRepositoryPort
{
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<WatchListModel, WatchList>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(WatchListModel, {
      entityName: "WatchList",
      generateShortId: true,
    });
  }

  async findByVideoId(videoId: string): Promise<WatchList | null> {
    const validatedId = this.validateId(videoId, "Video ID");
    return this.helper.findByField("videoId", validatedId);
  }

  async findById(id: string): Promise<WatchList | null> {
    const validatedId = this.validateId(id, "WatchList ID");
    return this.helper.findById(validatedId);
  }

  async create(data: WatchList): Promise<WatchList> {
    this.validateData(data, "WatchList data");

    // If the record already exists for the same unique pair (e.g., videoId+userId), return it
    const where: any = { userId: data.userId };
    if (data.videoId) where.videoId = data.videoId;
    if (data.movieId) where.movieId = data.movieId;
    if (data.episodeId) where.episodeId = data.episodeId;
    if (data.seasonId) where.seasonId = data.seasonId;
    if (data.seriesId) where.seriesId = data.seriesId;

    const existing = await WatchListModel.findOne({ where });
    if (existing) return existing as unknown as WatchList;

    const dataToCreate = {
      ...data,
      id: data.id || uuidv4().split("-")[0],
    };

    return this.helper.create(dataToCreate, true);
  }

  async update(id: string, data: Partial<WatchList>): Promise<WatchList> {
    const validatedId = this.validateId(id, "WatchList item ID");
    this.validateData(data, "Update data");
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "WatchList item ID");
    return this.helper.delete(validatedId);
  }

  async addSeries(userId: string, seriesId: string): Promise<void> {
    const { userId: uId, seriesId: sId } = this.validateIds({
      userId,
      seriesId,
    });

    const existing = await WatchListModel.findOne({
      where: { userId: uId, seriesId: sId },
    });
    if (existing) return;

    const newWatchListData = {
      userId: uId,
      seriesId: sId,
    };

    await this.helper.create(newWatchListData, true);
  }

  async removeSeries(userId: string, seriesId: string): Promise<boolean> {
    const { userId: uId, seriesId: sId } = this.validateIds({
      userId: String(userId),
      seriesId: String(seriesId),
    });

    const whereCondition = {
      userId: uId,
      seriesId: sId,
    };

    await this.helper.deleteRelationship(WatchListModel, whereCondition);
    return true;
  }

  async addSeason(userId: string, seasonId: string): Promise<void> {
    const { userId: uId, seasonId: seId } = this.validateIds({
      userId,
      seasonId,
    });

    const existing = await WatchListModel.findOne({
      where: { userId: uId, seasonId: seId },
    });
    if (existing) return;

    const newWatchListData = {
      userId: uId,
      seasonId: seId,
    };

    await this.helper.create(newWatchListData, true);
  }

  async removeSeason(userId: string, seasonId: string): Promise<boolean> {
    const { userId: uId, seasonId: seId } = this.validateIds({
      userId: String(userId),
      seasonId: String(seasonId),
    });

    const whereCondition = {
      userId: uId,
      seasonId: seId,
    };

    await this.helper.deleteRelationship(WatchListModel, whereCondition);
    return true;
  }

  async addEpisode(userId: string, episodeId: string): Promise<void> {
    const { userId: uId, episodeId: eId } = this.validateIds({
      userId,
      episodeId,
    });

    const existing = await WatchListModel.findOne({
      where: { userId: uId, episodeId: eId },
    });
    if (existing) return;

    const newWatchListData = {
      userId: uId,
      episodeId: eId,
    };

    await this.helper.create(newWatchListData, true);
  }

  async removeEpisode(userId: string, episodeId: string): Promise<boolean> {
    const { userId: uId, episodeId: eId } = this.validateIds({
      userId: String(userId),
      episodeId: String(episodeId),
    });

    const whereCondition = {
      userId: uId,
      episodeId: eId,
    };

    await this.helper.deleteRelationship(WatchListModel, whereCondition);
    return true;
  }

  async addMovie(userId: string, movieId: string): Promise<void> {
    const { userId: uId, movieId: mId } = this.validateIds({ userId, movieId });

    const existing = await WatchListModel.findOne({
      where: { userId: uId, movieId: mId },
    });
    if (existing) return;

    const newWatchListData = {
      userId: uId,
      movieId: mId,
    };

    await this.helper.create(newWatchListData, true);
  }

  async removeMovie(userId: string, movieId: string): Promise<boolean> {
    const { userId: uId, movieId: mId } = this.validateIds({
      userId: String(userId),
      movieId: String(movieId),
    });

    const whereCondition = {
      userId: uId,
      movieId: mId,
    };

    await this.helper.deleteRelationship(WatchListModel, whereCondition);
    return true;
  }

  async addVideo(userId: string, videoId: string): Promise<void> {
    const { userId: uId, videoId: vId } = this.validateIds({ userId, videoId });

    const existing = await WatchListModel.findOne({
      where: { userId: uId, videoId: vId },
    });
    if (existing) return;

    const newWatchListData = {
      userId: uId,
      videoId: vId,
    };

    await this.helper.create(newWatchListData, true);
  }

  async removeVideo(userId: string, videoId: string): Promise<boolean> {
    const { userId: uId, videoId: vId } = this.validateIds({
      userId: String(userId),
      videoId: String(videoId),
    });

    const whereCondition = {
      userId: uId,
      videoId: vId,
    };

    await this.helper.deleteRelationship(WatchListModel, whereCondition);
    return true;
  }

  async isVideoWatched(videoId: string, userId: string): Promise<boolean> {
    const { userId: uId, videoId: vId } = this.validateIds({
      userId: String(userId),
      videoId: String(videoId),
    });

    const existing = await WatchListModel.findOne({
      where: { userId: uId, videoId: vId },
    });
    return existing !== null;
  }

  async isSeriesWatched(seriesId: string, userId: string): Promise<boolean> {
    const { userId: uId, seriesId: sId } = this.validateIds({
      userId: String(userId),
      seriesId: String(seriesId),
    });

    const existing = await WatchListModel.findOne({
      where: { userId: uId, seriesId: sId },
    });
    return existing !== null;
  }

  async isMovieWatched(movieId: string, userId: string): Promise<boolean> {
    const { userId: uId, movieId: mId } = this.validateIds({
      userId: String(userId),
      movieId: String(movieId),
    });

    const existing = await WatchListModel.findOne({
      where: { userId: uId, movieId: mId },
    });
    return existing !== null;
  }

  async isSeasonWatched(seasonId: string, userId: string): Promise<boolean> {
    const { userId: uId, seasonId: sId } = this.validateIds({
      userId: String(userId),
      seasonId: String(seasonId),
    });

    const existing = await WatchListModel.findOne({
      where: { userId: uId, seasonId: sId },
    });
    return existing !== null;
  }
}
