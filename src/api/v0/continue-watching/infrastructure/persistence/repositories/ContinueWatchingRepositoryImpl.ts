import { BaseRepository } from "@/api/v0/base-repository/BaseRepository";
import { EpisodeModel } from "@/api/v0/episodes/infrastructure/persistence/models/EpisodeModel";
import { MovieModel } from "@/api/v0/movies/infrastructure/persistence/models/MovieModel";
import { SeasonModel } from "@/api/v0/seasons/infrastructure/persistence/models/SeasonModel";
import { SeriesModel } from "@/api/v0/series/infrastructure/persistence/models/SeriesModel";
import { VideoModel } from "@/api/v0/videos/infrastructure/persistence/models/VideoModel";
import { WatchList } from "@/api/v0/watch-lists/domain/WatchList";
import { WatchListModel } from "@/api/v0/watch-lists/infrastructure/persistence/models/WatchListModel";
import { v4 as uuidv4 } from "uuid";
import { ContinueWatchingRepositoryPort } from "../../../application/ports/ContinueWatchingRepositoryPort";
import { ContinueWatching } from "../../../domain/ContinueWatching";
import { ContinueWatchingModel } from "../models/ContinueWatchingModel";

export class ContinueWatchingRepositoryImpl
  extends BaseRepository
  implements ContinueWatchingRepositoryPort
{
  async getVideos(userId: string): Promise<any[]> {
    try {
      const elements = await ContinueWatchingModel.findAll({
        where: {
          userId: userId,
        },
        include: [
          {
            model: VideoModel,
            as: "video",
            required: true,
            include: [
              {
                model: EpisodeModel,
                as: "episode",
                include: [
                  {
                    model: SeasonModel,
                    as: "season",
                    include: [{ model: SeriesModel, as: "series" }],
                  },
                ],
              },
              { model: MovieModel, as: "movie" },
              {
                model: WatchListModel,
                as: "watchLists",
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Map to extract the videos with the necessary data
      const videos = elements
        .map((item) => {
          const itemVideo = item?.video;
          if (!itemVideo) return null;

          const filetedWatchList = itemVideo.watchLists.filter(
            (wl: WatchList) => wl.userId === userId
          );

          const timeWatched =
            filetedWatchList.length > 0
              ? filetedWatchList[0].timeWatched ?? 0
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
    } catch (error: any) {
      console.log(`Error fetching Continue_Watching videos: ${error.message}`);
      return [];
    }
  }

  async getCurrentEpisode(seriesId: string): Promise<ContinueWatching | null> {
    try {
      const continueWatching = await ContinueWatchingModel.findOne({
        where: {
          seriesId: seriesId,
        },
        include: [
          {
            model: VideoModel,
            as: "video",
            include: [{ model: EpisodeModel, as: "episode" }],
          },
        ],
      });

      return continueWatching ? continueWatching.toJSON() : null;
    } catch (error: any) {
      console.log(`Error fetching Currently_Watching: ${error.message}`);
      return null;
    }
  }

  async add(
    videoId: string,
    userId: string,
    seriesId?: string,
    movieId?: string
  ): Promise<ContinueWatching | null> {
    try {
      // Verify if the video is already in Continue Watching
      const existingElement = await ContinueWatchingModel.findOne({
        where: {
          videoId,
          userId,
        },
      });

      if (existingElement) {
        console.log(`Video with id ${videoId} is already in Continue Watching`);
        return existingElement;
      }

      // Remove videos from Continue Watching
      if (seriesId || movieId) {
        // Build the where clause dynamically
        const whereClause: {
          userId: string;
          seriesId?: string;
          movieId?: string;
        } = {
          userId,
        };

        if (seriesId) {
          whereClause.seriesId = seriesId;
        }

        if (movieId) {
          whereClause.movieId = movieId;
        }

        await ContinueWatchingModel.destroy({
          where: whereClause,
        });
      }

      // Genera un UUID para el id
      const newElementData = {
        id: uuidv4().split("-")[0],
        videoId,
        userId,
        seriesId: seriesId ?? null,
        movieId: movieId ?? null,
      };

      const newElement = new ContinueWatchingModel(newElementData);
      await newElement.save();
      return newElement.toJSON();
    } catch (error) {
      console.error("Error adding video to Continue Watching:", error);
      return null;
    }
  }

  async delete(videoId: string, userId?: string): Promise<void> {
    try {
      await ContinueWatchingModel.destroy({ where: { videoId, userId } });
    } catch (error) {
      console.error("Error deleting video from Continue Watching:", error);
    }
  }

  async deleteAll(
    userId: string,
    seriesId?: string,
    movieId?: string
  ): Promise<boolean> {
    // Ensure at least one of seriesId or movieId is provided
    if (!seriesId && !movieId) {
      return false;
    }

    // Build the where clause dynamically
    const whereClause: { userId: string; seriesId?: string; movieId?: string } =
      {
        userId,
      };

    if (seriesId) {
      whereClause.seriesId = seriesId;
    }

    if (movieId) {
      whereClause.movieId = movieId;
    }

    const affectedCount = await ContinueWatchingModel.destroy({
      where: whereClause,
    });

    return affectedCount > 0;
  }
}
