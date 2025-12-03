import { v4 as uuidv4 } from "uuid";
import { SongModel } from "../songs/infrastructure/persistence/models/SongModel";
import { PlayList } from "./domain/PlayList";
import { PlayListItemModel } from "./infrastructure/persistence/models/PlayListItemModel";
import { PlayListModel } from "./infrastructure/persistence/models/PlayListModel";

//#region GET
export const getPlayLists = () => {
  return PlayListModel.findAll();
};

export const getPlayListById = (id: string) => {
  return PlayListModel.findByPk(id, {
    include: [{ model: SongModel, as: "songs" }],
  });
};
//#endregion

export const addPlaylist = async (
  playList: Partial<PlayList>,
  userId?: string
) => {
  try {
    // Check if the playlist already exists
    if (playList.id) {
      const existingPlayList = await getPlayListById(playList.id);
      if (existingPlayList) {
        console.log(`La lista de reproducción con ID ${playList.id} ya existe`);
        return existingPlayList;
      }
    }

    const playListData = {
      ...playList,
      id: uuidv4().split("-")[0],
      userId,
    };

    const newPlayList = new PlayListModel(playListData);
    await newPlayList.save();
    return newPlayList;
  } catch (error) {
    console.error("Error al agregar la lista de reproducción:", error);
    return null;
  }
};

export const addSongToPlaylist = async (playlistId: string, songId: string) => {
  try {
    // Checks if the relation already exists
    const existingElement = await PlayListItemModel.findOne({
      where: {
        playlistId,
        songId,
      },
    });

    if (existingElement) {
      console.log(
        `La canción ${songId} ya está en la lista de reproducción ${playlistId}`
      );
      return existingElement;
    }

    const newElementData = {
      id: uuidv4().split("-")[0],
      playlistId,
      songId,
    };

    const newPlayListItem = new PlayListItemModel(newElementData);
    await newPlayListItem.save();
    return newPlayListItem;
  } catch (error) {
    console.error(
      "Error al agregar la canción a la lista de reproducción:",
      error
    );
    return null;
  }
};

export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
) => {
  try {
    // Check if the relation exists
    const existingElement = await PlayListItemModel.findOne({
      where: {
        playlistId,
        songId,
      },
    });

    if (!existingElement) {
      console.log(
        `La canción ${songId} no estaba en la lista de reproducción ${playlistId}`
      );
      return existingElement;
    }

    await existingElement.destroy();
    return existingElement;
  } catch (error) {
    console.error(
      "Error al eliminar la canción de la lista de reproducción:",
      error
    );
    return null;
  }
};

/**
 * Updates a PlayList record by ID.
 * @param id - The ID of the PlayList (String).
 * @param data - Partial data to update.
 * @returns The updated PlayList record.
 */
export async function updatePlayList(
  id: string,
  data: Partial<PlayList>
): Promise<PlayList> {
  const [affectedCount] = await PlayListModel.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`PlayList with ID ${id} not found`);
  }

  const updatedPlayList = await getPlayListById(id);

  if (!updatedPlayList) {
    throw new Error(`Failed to retrieve updated PlayList with ID ${id}`);
  }

  return updatedPlayList;
}

/**
 * Deletes a PlayList record by ID.
 * @param id - The ID of the PlayList (STRING).
 * @returns True if deletion is successful.
 */
export async function deletePlayList(id: string): Promise<boolean> {
  const affectedCount = await PlayListModel.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`PlayList with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes a PlayListItem record by ID.
 * @param id - The ID of the PlayListItem (STRING).
 * @returns True if deletion is successful.
 */
export async function deletePlayListItem(id: string): Promise<boolean> {
  const affectedCount = await PlayListItemModel.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`PlayListItem with ID ${id} not found`);
  }

  return true;
}
