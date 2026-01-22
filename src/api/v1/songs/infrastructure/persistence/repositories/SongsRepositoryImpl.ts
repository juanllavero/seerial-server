import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { SongsRepositoryPort } from "../../../application/ports/SongsRepositoryPort";
import { Song } from "../../../domain/Song";
import { SongModel } from "../models/SongModel";

export class SongsRepositoryImpl
  extends BaseRepository
  implements SongsRepositoryPort
{
  async findById(id: string): Promise<Song | null> {
    const validatedId = this.validateId(id, "Song ID");

    return this.handleRepositoryError(async () => {
      const song = await SongModel.findByPk(validatedId);

      return song ? (song.toJSON() as Song) : null;
    }, `Failed to retrieve song with ID ${id}`);
  }

  async findByPath(path: string): Promise<Song | null> {
    this.validateData(path, "Path data");

    return this.handleRepositoryError(async () => {
      const song = await SongModel.findOne({
        where: {
          fileSrc: path,
        },
      });

      return song ? (song.toJSON() as Song) : null;
    }, `Failed to retrieve song with path ${path}`);
  }

  async findByAlbum(albumId: string): Promise<Song[]> {
    const validatedId = this.validateId(albumId, "Album ID");

    return this.handleRepositoryError(async () => {
      const songs = await SongModel.findAll({
        where: {
          albumId: validatedId,
        },
      });

      return songs.map((song) => song.toJSON() as Song);
    }, `Failed to retrieve song with album ID ${albumId}`);
  }

  async create(song: Partial<Song>): Promise<Song | null> {
    this.validateData(song, "Song data");

    return this.handleRepositoryError(async () => {
      // Check if song already exists by ID
      if (song.id) {
        const existingSong = await this.findById(song.id);
        if (existingSong) {
          logger.info(`Song with ID ${song.id} already exists`);
          return existingSong;
        }
      }

      // Generate UUID if it doesn't exist
      const dataToCreate = {
        ...song,
        id: song.id || uuidv4().split("-")[0],
      };

      const createdSong = await SongModel.create(dataToCreate as any);
      return createdSong ? (createdSong.toJSON() as Song) : null;
    }, "Failed to create song");
  }

  async update(id: string, data: Partial<Song>): Promise<Song> {
    const validatedId = this.validateId(id, "Song ID");

    return this.handleRepositoryError(async () => {
      const [affectedCount] = await SongModel.update(data, {
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Song with ID ${id} not found`);

      const updatedSong = await this.findById(id);

      if (!updatedSong) {
        throw new Error(`Failed to retrieve updated song with ID ${id}`);
      }

      return updatedSong;
    }, `Failed to update song with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Song ID");

    return this.handleRepositoryError(async () => {
      const affected = await SongModel.destroy({ where: { id: validatedId } });
      this.ensureAffected(affected, `Song with ID ${id} not found`);
    }, `Failed to delete song with ID ${id}`);
  }
}
