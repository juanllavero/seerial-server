import { Movie } from "@/api/v0/movies/movies.model";
import { Series } from "@/api/v0/series/series.model";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { MyList } from "./my-lists.model";

//#region GET
export const getSeriesInMyList = async (userId: string) => {
  try {
    // Get the IDs of the series saved in MyList
    const myListSeries = await MyList.findAll({
      where: {
        seriesId: {
          [Op.not]: null,
        },
        userId: userId, // Filter by user ID if provided
      },
      attributes: ["seriesId"], // Only the ID
      order: [["addedAt", "DESC"]],
    });

    const seriesIds = myListSeries.map((item) => item.seriesId);

    if (seriesIds.length === 0) return [];

    // Search the series corresponding to those IDs
    const series = await Series.findAll({
      where: {
        id: {
          [Op.in]: seriesIds,
        },
      },
    });

    return series;
  } catch (error: any) {
    console.log(`Error fetching Series in My_List: ${error.message}`);
    return [];
  }
};

export const getMoviesInMyList = async (userId: string) => {
  try {
    // Get the IDs of the movies saved in MyList
    const myListMovies = await MyList.findAll({
      where: {
        movieId: {
          [Op.not]: null,
        },
        userId: userId, // Filter by user ID if provided
      },
      attributes: ["movieId"], // Only the ID
      order: [["addedAt", "DESC"]],
    });

    const movieIds = myListMovies.map((item) => item.movieId);

    if (movieIds.length === 0) return [];

    // Search the movies corresponding to those IDs
    const movies = await Movie.findAll({
      where: {
        id: {
          [Op.in]: movieIds,
        },
      },
    });

    return movies;
  } catch (error: any) {
    console.log(`Error fetching Movies in My_List: ${error.message}`);
    return [];
  }
};

export const getSeriesFromMyList = async (
  seriesId: string,
  userId?: string
) => {
  try {
    return await MyList.findOne({
      where: {
        seriesId: seriesId,
        userId: userId,
      },
    });
  } catch (error: any) {
    console.log(`Error fetching My_List items: ${error.message}`);
    return null;
  }
};

export const getMovieFromMyList = async (movieId: string, userId?: string) => {
  try {
    return await MyList.findOne({
      where: {
        movieId: movieId,
        userId: userId,
      },
    });
  } catch (error: any) {
    console.log(`Error fetching My_List items: ${error.message}`);
    return null;
  }
};
//#endregion

export const addSeriesToMyList = async (seriesId: string, userId?: string) => {
  try {
    // Verifica si la serie ya está en la lista
    const existingElement = await MyList.findOne({
      where: {
        seriesId,
        userId,
      },
    });

    if (existingElement) {
      console.log(`La serie ${seriesId} ya está en Mi Lista`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      seriesId,
      userId,
    };

    const newElement = new MyList(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar la serie a Mi Lista:", error);
    return null;
  }
};

export const removeSeriesFromMyList = async (
  seriesId: string,
  userId?: string
) => {
  try {
    // Verifica si la serie ya estaba en la lista
    const existingElement = await MyList.findOne({
      where: {
        seriesId,
        userId,
      },
    });

    if (!existingElement) {
      console.log(`La serie ${seriesId} no estaba en Mi Lista`);
      return existingElement;
    }

    await existingElement.destroy();
    return existingElement;
  } catch (error) {
    console.error("Error al eliminar la serie de Mi Lista:", error);
    return null;
  }
};

export const addMovieToMyList = async (movieId: string, userId?: string) => {
  try {
    // Verifica si la película ya está en la lista
    const existingElement = await MyList.findOne({
      where: {
        movieId,
        userId,
      },
    });

    if (existingElement) {
      console.log(`La película ${movieId} ya está en Mi Lista`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      movieId,
      userId,
    };

    const newElement = new MyList(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar la película a Mi Lista:", error);
    return null;
  }
};

export const removeMovieFromMyList = async (
  movieId: string,
  userId?: string
) => {
  try {
    // Verifica si la película ya estaba en la lista
    const existingElement = await MyList.findOne({
      where: {
        movieId,
        userId,
      },
    });

    if (!existingElement) {
      console.log(`La película ${movieId} no estaba en Mi Lista`);
      return existingElement;
    }

    await existingElement.destroy();
    return existingElement;
  } catch (error) {
    console.error("Error al eliminar la película de Mi Lista:", error);
    return null;
  }
};

/**
 * Deletes a MyList record by ID.
 * @param id - The ID of the MyList (STRING, UUID).
 * @returns True if deletion is successful.
 */
export async function deleteFromMyList(id: string): Promise<boolean> {
  const affectedCount = await MyList.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`MyList with ID ${id} not found`);
  }

  return true;
}
