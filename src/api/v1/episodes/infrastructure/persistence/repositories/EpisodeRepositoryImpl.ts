import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import { v4 as uuidv4 } from "uuid";
import { EpisodeRepositoryPort } from "../../../application/ports/EpisodeRepositoryPort";
import { Episode } from "../../../domain/Episode";
import { EpisodeModel } from "../models/EpisodeModel";

export class EpisodeRepositoryImpl
  extends BaseRepository
  implements EpisodeRepositoryPort
{
  async findAllBySeasonId(seasonId: string): Promise<Episode[]> {
    const validatedId = this.validateId(seasonId, "Season ID");
    return this.handleRepositoryError(async () => {
      const episodes = await EpisodeModel.findAll({
        where: { seasonId: validatedId },
      });
      return episodes.map((e) => e.toJSON() as Episode);
    }, `Failed to retrieve episodes for season with ID ${seasonId}`);
  }

  async findById(episodeId: string): Promise<Episode | null> {
    const validatedId = this.validateId(episodeId, "Episode ID");
    return this.handleRepositoryError(async () => {
      const episode = await EpisodeModel.findByPk(validatedId, {
        include: [
          {
            model: VideoModel,
            as: "video",
            include: [{ model: WatchListModel, as: "watchLists" }],
          },
        ],
      });
      return episode ? (episode.toJSON() as Episode) : null;
    }, `Failed to retrieve episode with ID ${episodeId}`);
  }

  async findByVideoSrc(videoSrc: string): Promise<Episode | null> {
    if (!videoSrc) throw new Error("Video source path is required");
    return this.handleRepositoryError(async () => {
      const video = await VideoModel.findOne({ where: { fileSrc: videoSrc } });
      if (!video || !video.episodeId) return null;

      const episode = await EpisodeModel.findByPk(video.episodeId);
      return episode ? (episode.toJSON() as Episode) : null;
    }, `Failed to retrieve episode by video source path ${videoSrc}`);
  }

  async create(data: Partial<Episode>): Promise<Episode | null> {
    this.validateData(data, "Episode data");

    return this.handleRepositoryError(async () => {
      if (data.id) {
        const existing = await EpisodeModel.findByPk(data.id);
        if (existing) return existing.toJSON() as Episode;
      }

      const episodeData = {
        ...data,
        id: data.id || uuidv4().split("-")[0],
      };

      const newEpisode = new EpisodeModel(episodeData as any);
      await newEpisode.save();
      return newEpisode.toJSON() as Episode;
    }, "Failed to create new episode");
  }

  async update(id: string, data: Partial<Episode>): Promise<Episode> {
    const validatedId = this.validateId(id, "Episode ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const [affectedCount] = await EpisodeModel.update(data as any, {
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Episode with ID ${id} not found`);

      const updatedEpisode = await this.findById(id);
      if (!updatedEpisode) {
        throw new Error(`Failed to retrieve updated episode with ID ${id}`);
      }
      return updatedEpisode;
    }, `Failed to update episode with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Episode ID");

    await this.handleRepositoryError(async () => {
      const affectedCount = await EpisodeModel.destroy({
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Episode with ID ${id} not found`);
    }, `Failed to delete episode with ID ${id}`);
  }
}
