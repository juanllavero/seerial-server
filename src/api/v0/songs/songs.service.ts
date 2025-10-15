import { v4 as uuidv4 } from "uuid";
import { Song } from "./songs.model";
import { SongData } from "./songs.types";

//#region GET
export const getSongs = (albumId: string) => {
  return Song.findAll({
    where: {
      albumId,
    },
  });
};

export const getSongById = (songId: string) => {
  return Song.findByPk(songId);
};

export const getSongByPath = async (fileSrc: string) => {
  return Song.findOne({
    where: {
      fileSrc: fileSrc,
    },
  });
};
//#endregion

export const addSong = async (song: Partial<SongData>) => {
  try {
    // Verifica si la canción ya existe
    if (song.id) {
      const existingSong = await getSongById(song.id);
      if (existingSong) {
        return existingSong;
      }
    }

    // Genera un UUID para el id
    const songData = {
      ...song,
      id: uuidv4().split("-")[0],
    };

    const newSong = new Song(songData);
    await newSong.save();
    return newSong;
  } catch (error) {
    console.error("Error al agregar la canción:", error);
    return null;
  }
};

/**
 * Updates a Song record by ID.
 * @param id - The ID of the Song (String).
 * @param data - Partial data to update.
 * @returns The updated Song record.
 */
export async function updateSong(
  id: string,
  data: Partial<Song>
): Promise<Song> {
  const [affectedCount] = await Song.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Song with ID ${id} not found`);
  }

  const updatedSong = await getSongById(id);

  if (!updatedSong) {
    throw new Error(`Failed to retrieve updated Song with ID ${id}`);
  }

  return updatedSong;
}

/**
 * Deletes a Song record by ID.
 * @param id - The ID of the Song (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteSong(id: string): Promise<boolean> {
  const affectedCount = await Song.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Song with ID ${id} not found`);
  }

  return true;
}
