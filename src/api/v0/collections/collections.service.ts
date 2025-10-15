import { Album } from "@/api/v0/albums/albums.model";
import { Library } from "@/api/v0/libraries/libraries.model";
import { LibraryCollection } from "@/api/v0/libraries/library-collection.model";
import { Movie } from "@/api/v0/movies/movies.model";
import { Series } from "@/api/v0/series/series.model";
import { getCollectionItemsKey, getItemModel } from "@/file-search/utils/utils";
import { v4 as uuidv4 } from "uuid";
import { CollectionAlbum } from "./collection-album.model";
import { CollectionMovie } from "./collection-movie.model";
import { CollectionSeries } from "./collection-series.model";
import { Collection } from "./collections.model";
import { CollectionData } from "./collections.types";

//#region GET
export const getCollections = async () => {
  return Collection.findAll();
};

export const getCollectionsInLibrary = async (
  libraryId: string,
  type: string
) => {
  const collectionItemsKey = getCollectionItemsKey(type);
  const ItemModel = getItemModel(type);

  return await Library.findByPk(libraryId, {
    include: [
      {
        model: Collection,
        as: "collections",
        include: [
          {
            model: ItemModel,
            as: collectionItemsKey,
            attributes: ["id", "coverSrc"],
          },
        ],
        through: {
          attributes: ["customOrder"],
        },
      },
    ],
  }).then((library) => library?.collections || []);
};

export const getCollectionById = async (id: string) => {
  try {
    const colection = await Collection.findByPk(id, {
      include: [
        {
          model: Series,
          as: "shows",
          through: {
            attributes: ["custom_order"],
          },
        },
        {
          model: Movie,
          as: "movies",
          through: {
            attributes: ["custom_order"],
          },
        },
        {
          model: Album,
          as: "albums",
          through: {
            attributes: ["custom_order"],
          },
        },
      ],
    });

    if (!colection) {
      console.log(`Collection with id ${id} not found`);
      return null;
    }

    return colection;
  } catch (error: any) {
    console.log(`Error fetching collection: ${error.message}`);
    return null;
  }
};
//#endregion

export const addCollection = async (collection: Partial<Collection>) => {
  try {
    // Verifica si ya existe una colección con el mismo título
    if (collection.title) {
      const existingCollection = await Collection.findOne({
        where: {
          title: collection.title,
        },
      });

      if (existingCollection) {
        return existingCollection;
      }
    }

    // Genera un UUID para el id
    const collectionData = {
      ...collection,
      id: uuidv4().split("-")[0],
    };

    const newCollection = new Collection(collectionData);
    await newCollection.save();
    return newCollection;
  } catch (error) {
    console.error("Error al agregar la colección:", error);
    return null;
  }
};

export const addLibraryToCollection = async (
  libraryId: string,
  collectionId: string
) => {
  try {
    // Verifica si ya existe la relación
    const existingElement = await LibraryCollection.findOne({
      where: {
        libraryId,
        collectionId,
      },
    });

    if (existingElement) {
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      libraryId,
      collectionId,
    };

    const newElement = new LibraryCollection(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar la biblioteca a la colección:", error);
    return null;
  }
};

export const addSeriesToCollection = async (
  collectionId: string,
  seriesId: string
) => {
  try {
    // Verifica si ya existe la relación
    const existingElement = await CollectionSeries.findOne({
      where: {
        collectionId,
        seriesId,
      },
    });

    if (existingElement) {
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      collectionId,
      seriesId,
    };

    const newElement = new CollectionSeries(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar la serie a la colección:", error);
    return null;
  }
};

export const addMovieToCollection = async (
  collectionId: string,
  movieId: string
) => {
  try {
    // Verifica si ya existe la relación
    const existingElement = await CollectionMovie.findOne({
      where: {
        collectionId,
        movieId,
      },
    });

    if (existingElement) {
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      collectionId,
      movieId,
    };

    const newElement = new CollectionMovie(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar la película a la colección:", error);
    return null;
  }
};

export const addAlbumToCollection = async (
  collectionId: string,
  albumId: string
) => {
  try {
    // Verifica si ya existe la relación
    const existingElement = await CollectionAlbum.findOne({
      where: {
        collectionId,
        albumId,
      },
    });

    if (existingElement) {
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      collectionId,
      albumId,
    };

    const newElement = new CollectionAlbum(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar el álbum a la colección:", error);
    return null;
  }
};

/**
 * Updates a Collection record by ID.
 * @param id - The ID of the Collection (String).
 * @param data - Partial data to update.
 * @returns The updated Collection record.
 */
export async function updateCollection(
  id: string,
  data: Partial<CollectionData>
): Promise<Collection> {
  const [affectedCount] = await Collection.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Collection with ID ${id} not found`);
  }

  const updatedCollection = await getCollectionById(id);

  if (!updatedCollection) {
    throw new Error(`Failed to retrieve updated Collection with ID ${id}`);
  }

  return updatedCollection;
}

/**
 * Deletes a Collection record by ID.
 * @param id - The ID of the Collection (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteCollection(id: string): Promise<boolean> {
  const affectedCount = await Collection.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Collection with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes a CollectionSeries record by composite key (collectionId, seriesId).
 * @param collectionId - The ID of the Collection (STRING).
 * @param seriesId - The ID of the Series (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteCollectionSeries(
  collectionId: number,
  seriesId: number
): Promise<boolean> {
  const affectedCount = await CollectionSeries.destroy({
    where: { collectionId, seriesId },
  });

  if (affectedCount === 0) {
    throw new Error(
      `CollectionSeries with collectionId ${collectionId} and seriesId ${seriesId} not found`
    );
  }

  return true;
}

/**
 * Deletes a CollectionMovie record by composite key (collectionId, movieId).
 * @param collectionId - The ID of the Collection (STRING).
 * @param movieId - The ID of the Movie (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteCollectionMovie(
  collectionId: number,
  movieId: number
): Promise<boolean> {
  const affectedCount = await CollectionMovie.destroy({
    where: { collectionId, movieId },
  });

  if (affectedCount === 0) {
    throw new Error(
      `CollectionMovie with collectionId ${collectionId} and movieId ${movieId} not found`
    );
  }

  return true;
}

/**
 * Deletes a CollectionAlbum record by composite key (collectionId, albumId).
 * @param collectionId - The ID of the Collection (STRING).
 * @param albumId - The ID of the Album (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteCollectionAlbum(
  collectionId: number,
  albumId: number
): Promise<boolean> {
  const affectedCount = await CollectionAlbum.destroy({
    where: { collectionId, albumId },
  });

  if (affectedCount === 0) {
    throw new Error(
      `CollectionAlbum with collectionId ${collectionId} and albumId ${albumId} not found`
    );
  }

  return true;
}
