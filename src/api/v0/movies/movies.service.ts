import { Video } from "@/api/v0/videos/videos.model";
import { WatchList } from "@/api/v0/watch-lists/watch-lists.model";
import { v4 as uuidv4 } from "uuid";
import { Movie } from "./movies.model";
import { MovieData } from "./movies.types";

//#region GET
export const getMovies = (libraryId: string) => {
  return Movie.findAll({
    where: {
      libraryId: libraryId,
    },
  });
};

export const getMovieById = (movieId: string) => {
  return Movie.findByPk(movieId, {
    include: [
      {
        model: Video,
        as: "videos",
        include: [{ model: WatchList, as: "watchLists" }],
      },
      { model: Video, as: "extras" },
      { model: WatchList, as: "watchLists" },
    ],
  });
};

export const getMovieByPath = async (videoSrc: string) => {
  const video: Video | null = await Video.findOne({
    where: {
      fileSrc: videoSrc,
    },
  });

  if (!video || !video.movieId) return null;

  return Movie.findByPk(video.movieId);
};
//#endregion

export const addMovie = async (movie: Partial<MovieData>) => {
  try {
    // Verifica si la película ya existe
    if (movie.id) {
      const existingMovie = await getMovieById(movie.id);
      if (existingMovie) {
        return existingMovie;
      }
    }

    // Genera un UUID para el id
    const movieData = {
      ...movie,
      id: uuidv4().split("-")[0],
    };

    const newMovie = new Movie(movieData);
    await newMovie.save();
    return newMovie;
  } catch (error) {
    console.error("Error al agregar la película:", error);
    return null;
  }
};

/**
 * Updates a Movie record by ID.
 * @param id - The ID of the Movie (String).
 * @param data - Partial data to update.
 * @returns The updated Movie record.
 */
export async function updateMovie(
  id: string,
  data: Partial<MovieData>
): Promise<Movie> {
  const [affectedCount] = await Movie.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Movie with ID ${id} not found`);
  }

  const updatedMovie = await getMovieById(id);

  if (!updatedMovie) {
    throw new Error(`Failed to retrieve updated Movie with ID ${id}`);
  }

  return updatedMovie;
}

/**
 * Deletes a Movie record by ID.
 * @param id - The ID of the Movie (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteMovie(id: string): Promise<boolean> {
  const affectedCount = await Movie.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Movie with ID ${id} not found`);
  }

  return true;
}
