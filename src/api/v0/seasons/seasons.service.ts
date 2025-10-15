import { Episode } from "@/api/v0/episodes/episodes.model";
import { Video } from "@/api/v0/videos/videos.model";
import { WatchList } from "@/api/v0/watch-lists/watch-lists.model";
import { v4 as uuidv4 } from "uuid";
import { Season } from "./seasons.model";
import { SeasonData } from "./seasons.types";

//#region GET
export const getSeasons = (seriesId: string) => {
  return Season.findAll({
    where: {
      seriesId: seriesId,
    },
  });
};

export const getSeasonById = (seasonId: string) => {
  return Season.findByPk(seasonId, {
    include: [
      {
        model: Episode,
        as: "episodes",
        include: [
          {
            model: Video,
            as: "video",
            include: [
              {
                model: WatchList,
                as: "watchLists",
              },
            ],
          },
        ],
      },
      {
        model: WatchList,
        as: "watchLists",
      },
    ],
  });
};
//#endregion

export const addSeason = async (season: Partial<SeasonData>) => {
  try {
    // Verifica si la temporada ya existe
    if (season.id) {
      const existingSeason = await getSeasonById(season.id);
      if (existingSeason) {
        return existingSeason;
      }
    }

    // Genera un UUID para el id
    const seasonData = {
      ...season,
      id: uuidv4().split("-")[0],
    };

    const newSeason = new Season(seasonData);
    await newSeason.save();
    return newSeason;
  } catch (error) {
    console.error("Error al agregar la temporada:", error);
    return null;
  }
};

/**
 * Updates a Season record by ID.
 * @param id - The ID of the Season (String).
 * @param data - Partial data to update.
 * @returns The updated Season record.
 */
export async function updateSeason(
  id: string,
  data: Partial<SeasonData>
): Promise<Season> {
  const [affectedCount] = await Season.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Season with ID ${id} not found`);
  }

  const updatedSeason = await getSeasonById(id);

  if (!updatedSeason) {
    throw new Error(`Failed to retrieve updated Season with ID ${id}`);
  }

  return updatedSeason;
}

/**
 * Deletes a Season record by ID.
 * @param id - The ID of the Season (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteSeason(id: string): Promise<boolean> {
  const affectedCount = await Season.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Season with ID ${id} not found`);
  }

  return true;
}
