import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { VideoRepositoryPort } from "../../../application/ports/VideosRepositoryPort";
import { Video } from "../../../domain/Video";
import { VideoModel } from "../models/VideoModel";

const videoRepositoryLogger = logger.child({ category: "Video Repository" });

export class VideosRepositoryImpl
  extends BaseRepository
  implements VideoRepositoryPort
{
  async findById(id: string): Promise<Video | null> {
    const validatedId = this.validateId(id, "Video ID");

    return this.handleRepositoryError(async () => {
      const video = await VideoModel.findByPk(validatedId);
      return video ? (video.toJSON() as Video) : null;
    }, `Failed to retrieve video with ID ${id}`);
  }

  async findByEpisodeId(episodeId: string): Promise<Video | null> {
    const validatedId = this.validateId(episodeId, "Episode ID");

    return this.handleRepositoryError(async () => {
      const video = await VideoModel.findOne({
        where: { episodeId: validatedId },
        include: [{ model: WatchListModel, as: "watchLists" }],
      });
      return video ? (video.toJSON() as Video) : null;
    }, `Failed to retrieve video for episode with ID ${episodeId}`);
  }

  async findByMovieId(movieId: string): Promise<Video[]> {
    const validatedId = this.validateId(movieId, "Movie ID");

    return this.handleRepositoryError(async () => {
      const videos = await VideoModel.findAll({
        where: { movieId: validatedId },
      });
      return videos ? videos.map((v) => v.toJSON()) : [];
    }, `Failed to retrieve video for movie with ID ${movieId}`);
  }

  async findByExtraId(extraId: string): Promise<Video | null> {
    const validatedId = this.validateId(extraId, "Extra ID");

    return this.handleRepositoryError(async () => {
      const video = await VideoModel.findOne({
        where: { extraId: validatedId },
      });
      return video ? (video.toJSON() as Video) : null;
    }, `Failed to retrieve video for extra with ID ${extraId}`);
  }

  async findByPath(path: string): Promise<Video | null> {
    this.validateData(path, "Video path");

    return this.handleRepositoryError(async () => {
      const video = await VideoModel.findOne({ where: { fileSrc: path } });
      return video ? (video.toJSON() as Video) : null;
    }, `Failed to retrieve video with path ${path}`);
  }

  async create(video: Video): Promise<Video> {
    this.validateData(video, "Video data");

    return this.handleRepositoryError(async () => {
      if (video.id) {
        const existing = await this.findById(video.id);
        if (existing) return existing;
      }

      const dataToCreate = {
        ...video,
        id: video.id || uuidv4().split("-")[0],
      } as any;

      const created = await VideoModel.create(dataToCreate);
      return created.toJSON() as Video;
    }, "Failed to create video");
  }

  async update(id: string, data: Partial<Video>): Promise<Video> {
    const validatedId = this.validateId(id, "Video ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const [affected] = await VideoModel.update(data as any, {
        where: { id: validatedId },
      });

      this.ensureAffected(affected, `Video with ID ${id} not found`);

      const updated = await this.findById(id);
      if (!updated)
        throw new Error(`Failed to retrieve updated video with ID ${id}`);
      return updated;
    }, `Failed to update video with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Video ID");

    await this.handleRepositoryError(async () => {
      const affected = await VideoModel.destroy({ where: { id: validatedId } });
      this.ensureAffected(affected, `Video with ID ${id} not found`);
    }, `Failed to delete video with ID ${id}`);
  }

  async addAsMovie(
    movieId: string,
    video?: Partial<Video>
  ): Promise<Video | null> {
    try {
      // Verify if the video already exists
      if (video && video.id) {
        const existingVideo = await this.findById(video.id);
        if (existingVideo) {
          return existingVideo;
        }
      }

      const videoData = {
        ...video,
        id: uuidv4().split("-")[0],
        movieId,
      };

      const newVideo = new VideoModel(videoData);
      await newVideo.save();
      return newVideo.toJSON() as Video;
    } catch (error) {
      videoRepositoryLogger.error(
        error,
        "Error al agregar el video como película"
      );
      return null;
    }
  }

  async addAsMovieExtra(
    movieId: string,
    video?: Partial<Video>
  ): Promise<Video | null> {
    try {
      // Verify if the video already exists
      if (video && video.id) {
        const existingVideo = await this.findById(video.id);
        if (existingVideo) {
          return existingVideo;
        }
      }

      const videoData = {
        ...video,
        id: uuidv4().split("-")[0],
        extraId: movieId,
      };

      const newVideo = new VideoModel(videoData);
      await newVideo.save();
      return newVideo.toJSON() as Video;
    } catch (error) {
      videoRepositoryLogger.error(
        error,
        "Error al agregar el video como extra de película"
      );
      return null;
    }
  }

  async addAsEpisode(
    episodeId: string,
    video?: Partial<Video>
  ): Promise<Video | null> {
    try {
      // Verify if the video already exists
      if (video && video.id) {
        const existingVideo = await this.findById(video.id);
        if (existingVideo) {
          return existingVideo;
        }
      }

      const videoData = {
        ...video,
        id: uuidv4().split("-")[0],
        episodeId,
      };

      const newVideo = new VideoModel(videoData);
      await newVideo.save();
      return newVideo.toJSON() as Video;
    } catch (error) {
      videoRepositoryLogger.error(
        error,
        "Error al agregar el video como episodio"
      );
      return null;
    }
  }
}
