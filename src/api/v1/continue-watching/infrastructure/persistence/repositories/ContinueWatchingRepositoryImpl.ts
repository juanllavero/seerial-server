import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { ContinueWatchingRepositoryPort } from "../../../application/ports/ContinueWatchingRepositoryPort";
import { ContinueWatching } from "../../../domain/ContinueWatching";
import { ContinueWatchingModel } from "../models/ContinueWatchingModel";

const continueWatchingLogger = logger.child({ category: "Continue Watching" });

export class ContinueWatchingRepositoryImpl
  extends BaseRepository
  implements ContinueWatchingRepositoryPort
{
  async getVideos(userId: string): Promise<any[]> {
    const validatedId = this.validateId(userId, "User ID");

    return this.handleRepositoryError(async () => {
      const elements = await ContinueWatchingModel.find({
        where: { userId: validatedId },
        relations: [
          "video",
          "video.episode",
          "video.episode.season",
          "video.episode.season.series",
          "video.movie",
          "video.watchLists",
        ],
        order: { createdAt: "DESC" },
      });

      // Map to extract the videos with the necessary data
      const videos = elements
        .map((item) => {
          const itemVideo = item?.video;
          if (!itemVideo) return null;

          const filteredWatchList =
            itemVideo.watchLists?.filter((wl) => wl.userId === validatedId) ||
            [];

          const timeWatched =
            filteredWatchList.length > 0
              ? filteredWatchList[0].timeWatched ?? 0
              : 0;

          // Validate episode
          if (itemVideo.episode) {
            const episode = itemVideo.episode;
            const season = episode?.season;
            const series = season?.series;

            if (!episode || !season || !series) return null;

            return {
              id: item.id,
              title: series.name ?? "Not found",
              subtitle: episode.name,
              episodeNumber: episode.episodeNumber ?? 0,
              seasonNumber: episode.seasonNumber ?? 0,
              date: episode.year ?? "",
              duration: itemVideo.runtime ?? 0,
              timeWatched: timeWatched,
              genres: series.genres ?? [],
              overview:
                episode.overview ?? season.overview ?? series.overview ?? "",
              backgroundImage: season.backgroundSrc,
              posterImage: series.coverSrc,
              logoImage: series.logoSrc,
              videoImage: itemVideo.imgSrc,
              episodeId: episode.id,
              videoId: itemVideo.id,
            };
          }

          // Validate movie
          if (itemVideo.movie) {
            const movie = itemVideo.movie;

            if (!movie) return null;

            return {
              id: item.id,
              title: movie.name ?? "Not found",
              date: movie.year ?? "",
              duration: itemVideo.runtime ?? 0,
              timeWatched: timeWatched,
              genres: movie.genres ?? [],
              overview: movie.overview,
              backgroundImage: movie.backgroundSrc,
              posterImage: movie.coverSrc,
              logoImage: movie.logoSrc,
              videoImage: itemVideo.imgSrc,
              movieId: movie.id,
              videoId: itemVideo.id,
            };
          }

          return null;
        })
        .filter((video) => video !== null); // Filter nulls

      return videos;
    }, "Error fetching Continue Watching videos");
  }

  async getCurrentEpisode(seriesId: string): Promise<ContinueWatching | null> {
    const validatedId = this.validateId(seriesId, "Series ID");

    return this.handleRepositoryError(async () => {
      const continueWatching = await ContinueWatchingModel.findOne({
        where: { seriesId: validatedId },
        relations: ["video", "video.episode"],
      });

      return continueWatching
        ? (continueWatching as unknown as ContinueWatching)
        : null;
    }, "Error fetching Currently Watching");
  }

  async add(
    videoId: string,
    userId: string,
    seriesId?: string,
    movieId?: string
  ): Promise<ContinueWatching | null> {
    const validated = this.validateIds({ videoId, userId });

    return this.handleRepositoryError(async () => {
      // Verify if the video is already in Continue Watching
      const existingElement = await ContinueWatchingModel.findOne({
        where: { videoId: validated.videoId, userId: validated.userId },
      });

      if (existingElement) {
        return existingElement as unknown as ContinueWatching;
      }

      // Remove videos from Continue Watching
      if (seriesId || movieId) {
        const whereClause: any = { userId: validated.userId };

        if (seriesId) {
          whereClause.seriesId = seriesId;
        }

        if (movieId) {
          whereClause.movieId = movieId;
        }

        await ContinueWatchingModel.delete(whereClause);
      }

      // Create new element
      const newElementData = {
        id: uuidv4().split("-")[0],
        videoId: validated.videoId,
        userId: validated.userId,
        seriesId: seriesId ?? undefined,
        movieId: movieId ?? undefined,
      };

      const newElement = ContinueWatchingModel.create(newElementData);
      await newElement.save();
      return newElement as unknown as ContinueWatching;
    }, "Error adding video to Continue Watching");
  }

  async delete(videoId: string, userId?: string): Promise<void> {
    const validated = this.validateIds({ videoId, userId });

    return this.handleRepositoryError(async () => {
      const result = await ContinueWatchingModel.delete({
        videoId: validated.videoId,
        userId: validated.userId ?? undefined,
      });

      this.ensureAffected(
        result.affected || 0,
        "Video not found in Continue Watching"
      );
    }, "Error deleting video from Continue Watching");
  }

  async deleteAll(
    userId: string,
    seriesId?: string,
    movieId?: string
  ): Promise<boolean> {
    const validatedId = this.validateId(userId, "User ID");

    return this.handleRepositoryError(async () => {
      // Ensure at least one of seriesId or movieId is provided
      if (!seriesId && !movieId) {
        return false;
      }

      const whereClause: any = { userId: validatedId };

      if (seriesId) {
        whereClause.seriesId = seriesId;
      }

      if (movieId) {
        whereClause.movieId = movieId;
      }

      const result = await ContinueWatchingModel.delete(whereClause);

      return (result.affected || 0) > 0;
    }, "Error deleting videos from Continue Watching");
  }
}
