import { Episode, Video, WatchList } from "@/api/v0/index.models";
import { v4 as uuidv4 } from "uuid";
import { EpisodeData } from "./episodes.types";

//#region GET
export const getEpisodes = (seasonId: string) => {
  return Episode.findAll({
    where: {
      seasonId: seasonId,
    },
  });
};

export const getEpisodeById = (episodeId: string) => {
  return Episode.findByPk(episodeId, {
    include: [
      {
        model: Video,
        as: "video",
        include: [{ model: WatchList, as: "watchLists" }],
      },
    ],
  });
};

export const getEpisodeByPath = async (videoSrc: string) => {
  const video: Video | null = await Video.findOne({
    where: {
      fileSrc: videoSrc,
    },
  });

  if (!video || !video.episodeId) return null;

  return Episode.findByPk(video.episodeId);
};
//#endregion

export const addEpisode = async (episode: Partial<EpisodeData>) => {
  try {
    // Verifica si el episodio ya existe
    if (episode.id) {
      const existingEpisode = await getEpisodeById(episode.id);
      if (existingEpisode) {
        return existingEpisode;
      }
    }

    // Genera un UUID para el id
    const episodeData = {
      ...episode,
      id: uuidv4().split("-")[0],
    };

    const newEpisode = new Episode(episodeData);
    await newEpisode.save();
    return newEpisode;
  } catch (error) {
    console.error("Error al agregar el episodio:", error);
    return null;
  }
};

/**
 * Updates an Episode record by ID.
 * @param id - The ID of the Episode (String).
 * @param data - Partial data to update.
 * @returns The updated Episode record.
 */
export async function updateEpisode(
  id: string,
  data: Partial<EpisodeData>
): Promise<Episode> {
  const [affectedCount] = await Episode.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Episode with ID ${id} not found`);
  }

  const updatedEpisode = await getEpisodeById(id);

  if (!updatedEpisode) {
    throw new Error(`Failed to retrieve updated Episode with ID ${id}`);
  }

  return updatedEpisode;
}

/**
 * Deletes an Episode record by ID.
 * @param id - The ID of the Episode (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteEpisode(id: string): Promise<boolean> {
  const affectedCount = await Episode.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Episode with ID ${id} not found`);
  }

  return true;
}
