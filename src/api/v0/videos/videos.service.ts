import { WatchList } from "@/api/v0/watch-lists/watch-lists.model";
import { v4 as uuidv4 } from "uuid";
import { Video } from "./videos.model";
import { VideoData } from "./videos.types";

//#region GET
export const getVideoById = async (id: string) => {
  return await Video.findByPk(id, {
    include: [{ model: WatchList, as: "watchLists" }],
  });
};

export const getVideoByEpisodeId = (episodeId: string) => {
  return Video.findOne({
    where: {
      episodeId,
    },
    include: [{ model: WatchList, as: "watchLists" }],
  });
};

export const getVideoByMovieId = (movieId: string) => {
  return Video.findAll({
    where: {
      movieId,
    },
  });
};

export const getVideoByExtraId = (extraId: string) => {
  return Video.findAll({
    where: {
      extraId,
    },
  });
};
//#endregion

export const addVideoAsMovie = async (
  movieId: string,
  video?: Partial<VideoData>
) => {
  try {
    // Verifica si el video ya existe
    if (video && video.id) {
      const existingVideo = await getVideoById(video.id);
      if (existingVideo) {
        return existingVideo;
      }
    }

    // Genera un UUID para el id
    const videoData = {
      ...video,
      id: uuidv4().split("-")[0],
      movieId,
    };

    const newVideo = new Video(videoData);
    await newVideo.save();
    return newVideo;
  } catch (error) {
    console.error("Error al agregar el video como película:", error);
    return null;
  }
};

export const addVideoAsMovieExtra = async (
  movieId: string,
  video?: Partial<VideoData>
) => {
  try {
    // Verifica si el video ya existe
    if (video && video.id) {
      const existingVideo = await getVideoById(video.id);
      if (existingVideo) {
        return existingVideo;
      }
    }

    // Genera un UUID para el id
    const videoData = {
      ...video,
      id: uuidv4().split("-")[0],
      extraId: movieId,
    };

    const newVideo = new Video(videoData);
    await newVideo.save();
    return newVideo;
  } catch (error) {
    console.error("Error al agregar el video como extra de película:", error);
    return null;
  }
};

export const addVideoAsEpisode = async (
  episodeId: string,
  video?: Partial<VideoData>
) => {
  try {
    // Verifica si el video ya existe
    if (video && video.id) {
      const existingVideo = await getVideoById(video.id);
      if (existingVideo) {
        return existingVideo;
      }
    }

    // Genera un UUID para el id
    const videoData = {
      ...video,
      id: uuidv4().split("-")[0],
      episodeId,
    };

    const newVideo = new Video(videoData);
    await newVideo.save();
    return newVideo;
  } catch (error) {
    console.error("Error al agregar el video como episodio:", error);
    return null;
  }
};

/**
 * Updates a Video record by ID.
 * @param id - The ID of the Video (String).
 * @param data - Partial data to update.
 * @returns The updated Video record.
 */
export async function updateVideo(
  id: string,
  data: Partial<VideoData>
): Promise<Video> {
  const [affectedCount] = await Video.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Video with ID ${id} not found`);
  }

  const updatedVideo = await getVideoById(id);

  if (!updatedVideo) {
    throw new Error(`Failed to retrieve updated Video with ID ${id}`);
  }

  return updatedVideo;
}

/**
 * Deletes a Video record by ID.
 * @param id - The ID of the Video (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteVideo(id: string): Promise<boolean> {
  const affectedCount = await Video.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Video with ID ${id} not found`);
  }

  return true;
}
