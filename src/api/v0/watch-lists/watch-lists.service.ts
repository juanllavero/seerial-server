import { v4 as uuidv4 } from "uuid";
import { WatchList } from "./watch-lists.model";

//#region GET
export const getWatchListByVideoId = async (
  videoId: string,
  userId: string
) => {
  try {
    return await WatchList.findOne({
      where: {
        videoId: videoId,
        userId: userId,
      },
    });
  } catch (error: any) {
    console.log(`Error fetching WatchList: ${error.message}`);
    return null;
  }
};

export const getWatchListById = async (id: string) => {
  try {
    const watchList = await WatchList.findByPk(id);

    if (!watchList) {
      return null;
    }

    return watchList;
  } catch (error: any) {
    console.log(`Error fetching WatchList: ${error.message}`);
    return null;
  }
};
//#endregion

export const addSeriesToWatchList = async (
  seriesId: string,
  userId?: string
) => {
  try {
    // Verifica si la serie ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        seriesId,
        userId,
      },
    });

    if (existingElement) {
      console.log(`La serie ${seriesId} ya estaba en Watch List`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      seriesId,
      userId,
    };

    const newElement = new WatchList(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar la serie a Watch List:", error);
    return null;
  }
};

export const removeSeriesFromWatchList = async (
  seriesId: string,
  userId?: string
) => {
  try {
    // Verifica si la serie ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        seriesId,
        userId,
      },
    });

    if (!existingElement) {
      console.log(`La serie ${seriesId} no estaba en Watch List`);
      return existingElement;
    }

    await existingElement.destroy();
    return existingElement;
  } catch (error) {
    console.error("Error al eliminar la serie de Watch List:", error);
    return null;
  }
};

export const addSeasonToWatchList = async (
  seasonId: string,
  userId?: string
) => {
  try {
    // Verifica si la temporada ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        seasonId,
        userId,
      },
    });

    if (existingElement) {
      console.log(`La temporada ${seasonId} ya estaba en Watch List`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      seasonId,
      userId,
    };

    const newElement = new WatchList(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar la temporada a Watch List:", error);
    return null;
  }
};

export const removeSeasonFromWatchList = async (
  seasonId: string,
  userId?: string
) => {
  try {
    // Verifica si la temporada ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        seasonId,
        userId,
      },
    });

    if (!existingElement) {
      console.log(`La temporada ${seasonId} no estaba en Watch List`);
      return existingElement;
    }

    await existingElement.destroy();
    return existingElement;
  } catch (error) {
    console.error("Error al eliminar la temporada de Watch List:", error);
    return null;
  }
};

export const addEpisodeToWatchList = async (
  episodeId: string,
  userId?: string
) => {
  try {
    // Verifica si el episodio ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        episodeId,
        userId,
      },
    });

    if (existingElement) {
      console.log(`El episodio ${episodeId} ya estaba en Watch List`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      episodeId,
      userId,
    };

    const newElement = new WatchList(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar el episodio a Watch List:", error);
    return null;
  }
};

export const removeEpisodeFromWatchList = async (
  episodeId: string,
  userId?: string
) => {
  try {
    // Verifica si el episodio ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        episodeId,
        userId,
      },
    });

    if (!existingElement) {
      console.log(`El episodio ${episodeId} no estaba en Watch List`);
      return existingElement;
    }

    await existingElement.destroy();
    return existingElement;
  } catch (error) {
    console.error("Error al eliminar el episodio de Watch List:", error);
    return null;
  }
};

export const addMovieToWatchList = async (movieId: string, userId?: string) => {
  try {
    // Verifica si el episodio ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        movieId,
        userId,
      },
    });

    if (existingElement) {
      console.log(`El episodio ${movieId} ya estaba en Watch List`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      movieId,
      userId,
    };

    const newElement = new WatchList(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar el episodio a Watch List:", error);
    return null;
  }
};

export const removeMovieFromWatchList = async (
  movieId: string,
  userId?: string
) => {
  try {
    // Verifica si el episodio ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        movieId,
        userId,
      },
    });

    if (!existingElement) {
      console.log(`El episodio ${movieId} no estaba en Watch List`);
      return existingElement;
    }

    await existingElement.destroy();
    return existingElement;
  } catch (error) {
    console.error("Error al eliminar el episodio de Watch List:", error);
    return null;
  }
};

export const addVideoToWatchList = async (videoId: string, userId?: string) => {
  try {
    // Verifica si el episodio ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        videoId,
        userId,
      },
    });

    if (existingElement) {
      console.log(`El episodio ${videoId} ya estaba en Watch List`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      videoId,
      userId,
    };

    const newElement = new WatchList(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar el episodio a Watch List:", error);
    return null;
  }
};

export const removeVideoFromWatchList = async (
  videoId: string,
  userId?: string
) => {
  try {
    // Verifica si el episodio ya estaba en la lista
    const existingElement = await WatchList.findOne({
      where: {
        videoId,
        userId,
      },
    });

    if (!existingElement) {
      console.log(`El episodio ${videoId} no estaba en Watch List`);
      return existingElement;
    }

    await existingElement.destroy();
    return existingElement;
  } catch (error) {
    console.error("Error al eliminar el episodio de Watch List:", error);
    return null;
  }
};

/**
 * Updates a WatchList record by ID.
 * @param id - The ID of the WatchList (String).
 * @param data - Partial data to update.
 * @returns The updated WatchList record.
 */
export async function updateWatchList(
  id: string,
  data: Partial<WatchList>
): Promise<WatchList> {
  const [affectedCount] = await WatchList.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`WatchList with ID ${id} not found`);
  }

  const updatedWatchList = await getWatchListById(id);

  if (!updatedWatchList) {
    throw new Error(`Failed to retrieve updated WatchList with ID ${id}`);
  }

  return updatedWatchList;
}
