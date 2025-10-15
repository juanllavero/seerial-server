import { Episode } from "@/api/v0/episodes/episodes.model";
import { Season } from "@/api/v0/seasons/seasons.model";
import { Video } from "@/api/v0/videos/videos.model";
import { WatchList } from "@/api/v0/watch-lists/watch-lists.model";
import { v4 as uuidv4 } from "uuid";
import { Series } from "./series.model";
import { SeriesData } from "./series.types";

//#region GET
export const getSeries = (libraryId: string) => {
  return Series.findAll({
    where: {
      libraryId: libraryId,
    },
  });
};

export const getSeriesById = (seriesId: string) => {
  return Series.findByPk(seriesId, {
    include: [
      {
        model: Season,
        as: "seasons",
      },
      {
        model: WatchList,
        as: "watchLists",
      },
    ],
  });
};

export const getAllSeriesDataById = (seriesId: string) => {
  return Series.findByPk(seriesId, {
    include: [
      {
        model: Season,
        as: "seasons",
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

export const addSeries = async (series: Partial<SeriesData>) => {
  try {
    // Verifica si la serie ya existe
    if (series.id) {
      const existingSeries = await getSeriesById(series.id);
      if (existingSeries) {
        return existingSeries;
      }
    }

    // Genera un UUID para el id
    const seriesData = {
      ...series,
      id: uuidv4().split("-")[0],
    };

    const newSeries = new Series(seriesData);
    await newSeries.save();
    return newSeries;
  } catch (error) {
    console.error("Error al agregar la serie:", error);
    return null;
  }
};

/**
 * Updates a Series record by ID.
 * @param id - The ID of the Series (String).
 * @param data - Partial data to update.
 * @returns The updated Series record.
 */
export async function updateSeries(
  id: string,
  data: Partial<SeriesData>
): Promise<Series> {
  const [affectedCount] = await Series.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Series with ID ${id} not found`);
  }

  const updatedSeries = await getSeriesById(id);

  if (!updatedSeries) {
    throw new Error(`Failed to retrieve updated Series with ID ${id}`);
  }

  return updatedSeries;
}

/**
 * Deletes a Series record by ID.
 * @param id - The ID of the Series (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteSeries(id: string): Promise<boolean> {
  const affectedCount = await Series.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Series with ID ${id} not found`);
  }

  return true;
}
