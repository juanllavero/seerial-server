import { BaseRepository } from "@/api/v0/base-repository/BaseRepository";
import { AlbumArtist, Artist, Song } from "@/api/v0/index.models";
import { v4 as uuidv4 } from "uuid";
import { AlbumRepositoryPort } from "../../../application/ports/AlbumRepositoryPort";
import { Album } from "../../../domain/Album";
import { Album as AlbumModel } from "../models/AlbumModel";

export class WatchListRepositoryImpl
  extends BaseRepository
  implements AlbumRepositoryPort
{
  async findAllByLibrary(libraryId: string): Promise<Album[]> {
    const validatedId = this.validateId(libraryId, "Library ID");

    return this.handleRepositoryError(async () => {
      const albums = await AlbumModel.findAll({
        where: { libraryId: validatedId },
      });
      return albums.map((album) => new Album(album.toJSON()));
    }, `Failed to retrieve albums for library ${libraryId}`);
  }

  async findById(id: string, includeSongs = true): Promise<Album | null> {
    const validatedId = this.validateId(id, "Album ID");

    return this.handleRepositoryError(async () => {
      const includeOptions = [
        { model: Artist, as: "artists" },
        ...(includeSongs ? [{ model: Song, as: "songs" }] : []),
      ];

      const album = await AlbumModel.findByPk(validatedId, {
        include: includeOptions,
      });

      return album ? new Album(album.toJSON()) : null;
    }, `Failed to retrieve album with ID ${id}`);
  }

  async create(album: Album): Promise<Album> {
    this.validateData(album, "Album data");

    return this.handleRepositoryError(async () => {
      const albumData = album.toJSON();

      // Check if album already exists by ID
      if (albumData.id) {
        const existingAlbum = await this.findById(albumData.id, false);
        if (existingAlbum) {
          console.log(`Album with ID ${albumData.id} already exists`);
          return existingAlbum;
        }
      }

      // Generate UUID if it doesn't exist
      const dataToCreate = {
        ...albumData,
        id: albumData.id || uuidv4().split("-")[0],
      };

      const createdAlbum = await AlbumModel.create(dataToCreate as any);
      return new Album(createdAlbum.toJSON());
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
      const existingRelation = await AlbumArtist.findOne({
        where: {
          artistId: validated.artistId,
          albumId: validated.albumId,
        },
      });

      if (existingRelation) {
        console.log(
          `Relation between artist ${artistId} and album ${albumId} already exists`
        );
        return existingRelation.toJSON();
      }

      // Create new relation
      const newRelation = await AlbumArtist.create({
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
      const affectedCount = await AlbumArtist.destroy({
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
