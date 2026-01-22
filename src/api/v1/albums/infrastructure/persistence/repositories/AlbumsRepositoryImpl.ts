import { ArtistModel } from "@/api/v1/artists/infrastructure/persistence/models/ArtistModel";
import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { SongModel } from "@/api/v1/songs/infrastructure/persistence/models/SongModel";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { AlbumsRepositoryPort } from "../../../application/ports/AlbumsRepositoryPort";
import { Album } from "../../../domain/Album";
import { AlbumArtistModel } from "../models/AlbumArtistModel";
import { AlbumModel } from "../models/AlbumModel";

export class AlbumsRepositoryImpl
  extends BaseRepository
  implements AlbumsRepositoryPort
{
  async findAll(libraryId: string): Promise<Album[]> {
    const validatedId = this.validateId(libraryId, "Library ID");

    return this.handleRepositoryError(async () => {
      const albums = await AlbumModel.findAll({
        where: { libraryId: validatedId },
      });
      return albums.map((album) => album.toJSON() as Album);
    }, `Failed to retrieve albums for library ${libraryId}`);
  }

  async findById(id: string, includeSongs = true): Promise<Album | null> {
    const validatedId = this.validateId(id, "Album ID");

    return this.handleRepositoryError(async () => {
      const includeOptions = [
        { model: ArtistModel, as: "artists" },
        ...(includeSongs ? [{ model: SongModel, as: "songs" }] : []),
      ];

      const album = await AlbumModel.findByPk(validatedId, {
        include: includeOptions,
      });

      return album ? (album.toJSON() as Album) : null;
    }, `Failed to retrieve album with ID ${id}`);
  }

  async create(album: Partial<Album>): Promise<Album> {
    this.validateData(album, "Album data");

    return this.handleRepositoryError(async () => {
      // Check if album already exists by ID
      if (album.id) {
        const existingAlbum = await this.findById(album.id, false);
        if (existingAlbum) {
          logger.info(`Album with ID ${album.id} already exists`);
          return existingAlbum;
        }
      }

      // Generate UUID if it doesn't exist
      const dataToCreate = {
        ...album,
        id: album.id || uuidv4().split("-")[0],
      };

      const createdAlbum = await AlbumModel.create(dataToCreate as any);
      return createdAlbum.toJSON() as Album;
    }, "Failed to create album");
  }

  async update(id: string, data: Partial<Album>): Promise<Album> {
    const validatedId = this.validateId(id, "Album ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const [affectedCount] = await AlbumModel.update(data as any, {
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Album with ID ${id} not found`);

      const updatedAlbum = await this.findById(id, false);
      if (!updatedAlbum) {
        throw new Error(`Failed to retrieve updated album with ID ${id}`);
      }

      return updatedAlbum;
    }, `Failed to update album with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Album ID");

    await this.handleRepositoryError(async () => {
      const affectedCount = await AlbumModel.destroy({
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Album with ID ${id} not found`);
    }, `Failed to delete album with ID ${id}`);
  }

  async addArtistToAlbum(
    artistId: string,
    albumId: string
  ): Promise<{ id: string; artistId: string; albumId: string }> {
    const validated = this.validateIds({ artistId, albumId });

    return this.handleRepositoryError(async () => {
      // Check if relation already exists
      const existingRelation = await AlbumArtistModel.findOne({
        where: {
          artistId: validated.artistId,
          albumId: validated.albumId,
        },
      });

      if (existingRelation) {
        logger.info(
          `Relation between artist ${artistId} and album ${albumId} already exists`
        );
        return existingRelation.toJSON();
      }

      // Create new relation
      const newRelation = await AlbumArtistModel.create({
        id: uuidv4().split("-")[0],
        artistId: validated.artistId,
        albumId: validated.albumId,
      } as any);

      return newRelation.toJSON();
    }, `Failed to add artist ${artistId} to album ${albumId}`);
  }

  async removeArtistFromAlbum(
    artistId: string,
    albumId: string
  ): Promise<void> {
    const validated = this.validateIds({ artistId, albumId });

    await this.handleRepositoryError(async () => {
      const affectedCount = await AlbumArtistModel.destroy({
        where: {
          artistId: validated.artistId,
          albumId: validated.albumId,
        },
      });

      this.ensureAffected(
        affectedCount,
        `Relation between artist ${artistId} and album ${albumId} not found`
      );
    }, `Failed to remove artist ${artistId} from album ${albumId}`);
  }
}
