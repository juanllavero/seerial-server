import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { PlayListRepositoryPort } from "../../../application/ports/PlayListRepositoryPort";
import { PlayList } from "../../../domain/PlayList";
import { PlayListItemModel } from "../models/PlayListItemModel";
import { PlayListModel } from "../models/PlayListModel";

export class PlayListRepositoryImpl
  extends BaseRepository
  implements PlayListRepositoryPort
{
  async findAll(): Promise<PlayList[]> {
    return this.handleRepositoryError(async () => {
      const playlists = await PlayListModel.find({
        relations: ["songs"],
      });
      return playlists.map((playlist) => playlist as unknown as PlayList);
    }, "Failed to retrieve playlists");
  }

  async findById(id: string): Promise<PlayList | null> {
    const validatedId = this.validateId(id, "PlayList ID");

    return this.handleRepositoryError(async () => {
      const playlist = await PlayListModel.findOne({
        where: { id: validatedId },
        relations: ["songs"],
      });

      return playlist ? (playlist as unknown as PlayList) : null;
    }, `Failed to retrieve playlist with ID ${id}`);
  }

  async create(playList: PlayList): Promise<PlayList> {
    this.validateData(playList, "PlayList data");

    return this.handleRepositoryError(async () => {
      // Check if playlist already exists by ID
      if (playList.id) {
        const existingPlayList = await this.findById(playList.id);
        if (existingPlayList) {
          logger.info(`PlayList with ID ${playList.id} already exists`);
          return existingPlayList;
        }
      }

      // Generate UUID if it doesn't exist
      const dataToCreate = {
        ...playList,
        id: playList.id || uuidv4().split("-")[0],
      };

      const createdPlayList = PlayListModel.create(dataToCreate);
      await createdPlayList.save();
      return createdPlayList as unknown as PlayList;
    }, "Failed to create playlist");
  }

  async update(id: string, data: Partial<PlayList>): Promise<PlayList> {
    const validatedId = this.validateId(id, "PlayList ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const result = await PlayListModel.update({ id: validatedId }, data);

      this.ensureAffected(
        result.affected || 0,
        `PlayList with ID ${id} not found`
      );

      const updatedPlayList = await this.findById(id);
      if (!updatedPlayList) {
        throw new Error(`Failed to retrieve updated playlist with ID ${id}`);
      }

      return updatedPlayList;
    }, `Failed to update playlist with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "PlayList ID");

    await this.handleRepositoryError(async () => {
      const result = await PlayListModel.delete({ id: validatedId });

      this.ensureAffected(
        result.affected || 0,
        `PlayList with ID ${id} not found`
      );
    }, `Failed to delete playlist with ID ${id}`);
  }

  async addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
    const validated = this.validateIds({ playlistId, songId });

    await this.handleRepositoryError(async () => {
      // Check if relation already exists
      const existingRelation = await PlayListItemModel.findOne({
        where: {
          playlistId: validated.playlistId,
          songId: validated.songId,
        },
      });

      if (existingRelation) {
        logger.info(`Song ${songId} is already in playlist ${playlistId}`);
        return;
      }

      // Create new relation
      const newRelation = PlayListItemModel.create({
        id: uuidv4().split("-")[0],
        playlistId: validated.playlistId,
        songId: validated.songId,
      });
      await newRelation.save();
    }, `Failed to add song ${songId} to playlist ${playlistId}`);
  }

  async removeSongFromPlaylist(
    playlistId: string,
    songId: string
  ): Promise<void> {
    const validated = this.validateIds({ playlistId, songId });

    await this.handleRepositoryError(async () => {
      const result = await PlayListItemModel.delete({
        playlistId: validated.playlistId,
        songId: validated.songId,
      });

      this.ensureAffected(
        result.affected || 0,
        `Song ${songId} not found in playlist ${playlistId}`
      );
    }, `Failed to remove song ${songId} from playlist ${playlistId}`);
  }
}
