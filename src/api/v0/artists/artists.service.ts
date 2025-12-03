import { v4 as uuidv4 } from "uuid";
import { AlbumModel } from "../albums/infrastructure/persistence/models/AlbumModel";
import { Artist } from "./artists.model";
import { ArtistData } from "./artists.types";

export const getArtistById = (artistId: string) => {
  return Artist.findByPk(artistId, {
    include: [{ model: AlbumModel, as: "albums" }],
  });
};

export const addArtist = async (artist: Partial<ArtistData>) => {
  try {
    // Verifica si el artista ya existe
    if (artist.name) {
      const existingArtist = await Artist.findOne({
        where: {
          name: artist.name,
        },
      });

      if (existingArtist) {
        return existingArtist;
      }
    }

    // Genera un UUID para el id
    const artistData = {
      ...artist,
      id: uuidv4().split("-")[0],
    };

    const newArtist = new Artist(artistData);
    await newArtist.save();
    return newArtist;
  } catch (error) {
    console.error("Error al agregar el artista:", error);
    return null;
  }
};

/**
 * Updates an Artist record by ID.
 * @param id - The ID of the Artist (String).
 * @param data - Partial data to update.
 * @returns The updated Artist record.
 */
export async function updateArtist(
  id: string,
  data: Partial<Artist>
): Promise<Artist> {
  const [affectedCount] = await Artist.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Artist with ID ${id} not found`);
  }

  const updatedArtist = await getArtistById(id);

  if (!updatedArtist) {
    throw new Error(`Failed to retrieve updated Artist with ID ${id}`);
  }

  return updatedArtist;
}

/**
 * Deletes an Artist record by ID.
 * @param id - The ID of the Artist (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteArtist(id: string): Promise<boolean> {
  const affectedCount = await Artist.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Artist with ID ${id} not found`);
  }

  return true;
}
