import { Artist } from "@/api/v0/artists/artists.model";
import { Song } from "@/api/v0/songs/songs.model";
import { v4 as uuidv4 } from "uuid";
import { AlbumArtist } from "./album-artist.model";
import { Album } from "./albums.model";
import { AlbumData } from "./albums.types";

//#region GET
export const getAlbums = (libraryId: string) => {
  return Album.findAll({
    where: {
      libraryId: libraryId,
    },
  });
};

export const getAlbumById = (albumId: string) => {
  return Album.findByPk(albumId, {
    include: [
      { model: Song, as: "songs" },
      { model: Artist, as: "artists" },
    ],
  });
};
//#endregion

export const addAlbum = async (album: Partial<AlbumData>) => {
  try {
    // Verifica si el álbum ya existe
    if (album.id) {
      const existingAlbum = await getAlbumById(album.id);
      if (existingAlbum) {
        return existingAlbum;
      }
    }

    // Genera un UUID para el id
    const albumData = {
      ...album,
      id: uuidv4().split("-")[0],
    };

    const newAlbum = new Album(albumData);
    await newAlbum.save();
    return newAlbum;
  } catch (error) {
    console.error("Error al agregar el álbum:", error);
    return null;
  }
};

export const addArtistToAlbum = async (artistId: string, albumId: string) => {
  try {
    // Verifica si la relación ya existe
    const existingElement = await AlbumArtist.findOne({
      where: {
        artistId,
        albumId,
      },
    });

    if (existingElement) {
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      artistId,
      albumId,
    };

    const newElement = new AlbumArtist(newElementData);
    await newElement.save();
    return newElement;
  } catch (error) {
    console.error("Error al agregar el artista al álbum:", error);
    return null;
  }
};

/**
 * Updates an Album record by ID.
 * @param id - The ID of the Album (String).
 * @param data - Partial data to update.
 * @returns The updated Album record.
 */
export async function updateAlbum(
  id: string,
  data: Partial<Album>
): Promise<Album> {
  const [affectedCount] = await Album.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Album with ID ${id} not found`);
  }

  const updatedAlbum = await getAlbumById(id);

  if (!updatedAlbum) {
    throw new Error(`Failed to retrieve updated Album with ID ${id}`);
  }

  return updatedAlbum;
}

/**
 * Deletes an Album record by ID.
 * @param id - The ID of the Album (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteAlbum(id: string): Promise<boolean> {
  const affectedCount = await Album.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Album with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes an AlbumArtist record by composite key (albumId, artistId).
 * @param albumId - The ID of the Album (STRING).
 * @param artistId - The ID of the Artist (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteAlbumArtist(
  albumId: number,
  artistId: number
): Promise<boolean> {
  const affectedCount = await AlbumArtist.destroy({
    where: { albumId, artistId },
  });

  if (affectedCount === 0) {
    throw new Error(
      `AlbumArtist with albumId ${albumId} and artistId ${artistId} not found`
    );
  }

  return true;
}
