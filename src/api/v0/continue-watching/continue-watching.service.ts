import {
  ContinueWatching,
  Episode,
  Movie,
  Season,
  Series,
  Video,
  WatchList,
} from "@/api/v0/index.models";
import { v4 as uuidv4 } from "uuid";

//#region GET
export const getContinueWatchingVideos = async (userId: string) => {
  try {
    const elements = await ContinueWatching.findAll({
      where: {
        userId: userId,
      },
      include: [
        {
          model: Video,
          as: "video",
          required: true,
          include: [
            {
              model: Episode,
              as: "episode",
              include: [
                {
                  model: Season,
                  as: "season",
                  include: [{ model: Series, as: "series" }],
                },
              ],
            },
            { model: Movie, as: "movie" },
            {
              model: WatchList,
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
};

export const getCurrentlyWatchingEpisodeId = async (seriesId: string) => {
  try {
    return await ContinueWatching.findOne({
      where: {
        seriesId: seriesId,
      },
      include: [
        {
          model: Video,
          as: "video",
          include: [{ model: Episode, as: "episode" }],
        },
      ],
    });
  } catch (error: any) {
    console.log(`Error fetching Currently_Watching: ${error.message}`);
    return null;
  }
};
//#endregion

export const addVideoToContinueWatching = async (
  videoId: string,
  userId: string,
  seriesId?: string,
  movieId?: string
) => {
  try {
    // Verifica si el video ya está en Continue Watching
    const existingElement = await ContinueWatching.findOne({
      where: {
        videoId,
        userId,
      },
    });

    if (existingElement) {
      console.log(`El video ${videoId} ya está en Continue Watching`);
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

      await ContinueWatching.destroy({
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

    const newElement = new ContinueWatching(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar el video a Continue Watching:", error);
    return null;
  }
};

export const removeVideoFromContinueWatching = async (
  videoId: string,
  userId?: string
) => {
  try {
    await ContinueWatching.destroy({ where: { videoId, userId } });
  } catch (error) {
    console.error("Error al eliminar video de Continue Watching:", error);
  }
};

/**
 * Deletes a ContinueWatching record by ID.
 * @param id - The ID of the ContinueWatching (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteFromContinueWatching(id: string): Promise<boolean> {
  const affectedCount = await ContinueWatching.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`ContinueWatching with ID ${id} not found`);
  }

  return true;
}

export async function deleteAllVideosFromContinueWatching(
  userId: string,
  seriesId?: string,
  movieId?: string
): Promise<boolean> {
  // Ensure at least one of seriesId or movieId is provided
  if (!seriesId && !movieId) {
    return false;
  }

  // Build the where clause dynamically
  const whereClause: { userId: string; seriesId?: string; movieId?: string } = {
    userId,
  };

  if (seriesId) {
    whereClause.seriesId = seriesId;
  }

  if (movieId) {
    whereClause.movieId = movieId;
  }

  const affectedCount = await ContinueWatching.destroy({
    where: whereClause,
  });

  return affectedCount > 0;
}
