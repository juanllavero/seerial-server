import { Album } from "@/api/v0/albums/albums.model";
import { getAlbumById } from "@/api/v0/albums/albums.service";
import { Episode } from "@/api/v0/episodes/episodes.model";
import { getEpisodeById } from "@/api/v0/episodes/episodes.service";
import { Movie } from "@/api/v0/movies/movies.model";
import { getMovieById } from "@/api/v0/movies/movies.service";
import { getSeasonById } from "@/api/v0/seasons/seasons.service";
import { Series } from "@/api/v0/series/series.model";
import { getSeriesById } from "@/api/v0/series/series.service";
import { getVideoById } from "@/api/v0/videos/videos.service";
import { WatchList } from "@/api/v0/watch-lists/watch-lists.model";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { v4 as uuidv4 } from "uuid";
import { Library } from "./libraries.model";
import { LibraryData } from "./libraries.types";

//#region GET
export const getLibraries = () => {
  return Library.findAll({
    order: [["order", "ASC"]],
  });
};

/**
 * Retrieves items for a specific library based on the given type.
 * @param libraryId - The ID of the library.
 * @param type - The type of items to retrieve ('Movies', 'Shows', 'Music').
 * @returns A promise that resolves to an array of items (Movie[], Series[], or Album[]).
 */
export async function getItemsForLibrary(libraryId: string, type: string) {
  try {
    let items: Movie[] | Series[] | Album[] = [];

    if (type === "Movies") {
      items = await Movie.findAll({
        where: { libraryId },
        order: [
          ["order", "ASC"],
          ["name", "ASC"],
        ],
        include: [{ model: WatchList, as: "watchLists" }],
      });
    } else if (type === "Series" || type === "Shows") {
      items = await Series.findAll({
        where: { libraryId },
        order: [
          ["order", "ASC"],
          ["name", "ASC"],
        ],
        include: [{ model: WatchList, as: "watchLists" }],
      });
    } else if (type === "Music") {
      items = await Album.findAll({
        where: { libraryId },
        order: [
          ["order", "ASC"],
          ["title", "ASC"],
        ],
      });
    }

    return items;
  } catch (error) {
    console.error(
      `Error fetching items for library ${libraryId} (type: ${type}):`,
      error
    );
    return [];
  }
}

export const getLibraryById = async (id: string) => {
  try {
    const library = await Library.findByPk(id);

    if (!library) {
      return null;
    }

    return library;
  } catch (error: any) {
    console.log(`Error fetching library: ${error.message}`);
    return null;
  }
};

export const getLibraryByAlbumId = async (albumId: string) => {
  const album = await getAlbumById(albumId);

  if (!album) return null;

  return album.libraryId;
};

export const getLibraryByMovieId = async (movieId: string) => {
  const movie = await getMovieById(movieId);

  if (!movie) return null;

  return movie.libraryId;
};

export const getLibraryBySeriesId = async (seriesId: string) => {
  const series = await getSeriesById(seriesId);

  if (!series) return null;

  return series.libraryId;
};

export const getLibraryBySeasonId = async (seasonId: string) => {
  const season = await getSeasonById(seasonId);

  if (!season) return null;

  const series = await getSeriesById(season.seriesId);

  if (!series) return null;

  return series.libraryId;
};

export const getLibraryByVideoId = async (videoId: string) => {
  const video = await getVideoById(videoId);

  if (!video) return null;

  let element: Episode | Movie | null = video.episodeId
    ? await getEpisodeById(video.episodeId)
    : await getMovieById(video.movieId ?? video.extraId ?? "");

  if (!element) return null;

  if (element instanceof Episode) {
    const season = await getSeasonById(element.seasonId);

    if (!season) return null;

    const series = await getSeriesById(season.seriesId);

    if (!series) return null;

    return series.libraryId;
  }

  return element.libraryId;
};
//#endregion

export const addLibrary = async (library: Partial<LibraryData>) => {
  if (!library) {
    console.error("Error: No library data provided");
    return null;
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const libraryData = {
      ...library,
      id: uuidv4().split("-")[0],
    };

    try {
      // Verifica si el id ya existe
      const existingLibrary = await Library.findOne({
        where: { id: libraryData.id },
      });
      if (existingLibrary) {
        console.log(`Colisión de UUID: ${libraryData.id}. Reintentando...`);
        attempts++;
        continue;
      }

      const newLibrary = new Library(libraryData);
      await newLibrary.save();
      return newLibrary;
    } catch (error) {
      console.error(
        `Error al intentar guardar la librería (intento ${
          attempts + 1
        }/${maxAttempts}):`,
        error
      );
      attempts++;
      continue;
    }
  }

  console.error(
    "Error: No se pudo generar un UUID único después de varios intentos"
  );
  return null;
};

/**
 * Updates a Library record by ID.
 * @param id - The ID of the Library (String).
 * @param data - Partial data to update.
 * @returns The updated Library record.
 */
export async function updateLibrary(
  id: string,
  data: Partial<LibraryData>
): Promise<Library> {
  const [affectedCount] = await Library.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new ApiError(404, messages.errors.notFound.library);
  }

  const updatedLibrary = await getLibraryById(id);

  if (!updatedLibrary) {
    throw new ApiError(500, `Failed to retrieve updated Library with ID ${id}`);
  }

  return updatedLibrary;
}

/**
 * Deletes a Library record by ID.
 * @param id - The ID of the Library (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteLibrary(id: string): Promise<boolean> {
  const affectedCount = await Library.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Library with ID ${id} not found`);
  }

  return true;
}
