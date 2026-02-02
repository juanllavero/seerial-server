import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
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
      const albums = await AlbumModel.find({
        where: { libraryId: validatedId },
      });
      return albums.map((album) => album as unknown as Album);
    }, `Failed to retrieve albums for library ${libraryId}`);
  }

  async findById(id: string, includeSongs = true): Promise<Album | null> {
    const validatedId = this.validateId(id, "Album ID");

    return this.handleRepositoryError(async () => {
      const relations = ["artists"];
      if (includeSongs) {
        relations.push("songs");
      }

      const album = await AlbumModel.findOne({
        where: { id: validatedId },
        relations,
      });

      return album ? (album as unknown as Album) : null;
    }, `Failed to retrieve album with ID ${id}`);
  }

  async create(album: Partial<Album>): Promise<Album> {
    this.validateData(album, "Album data");

    return this.handleRepositoryError(async () => {
      // Check if album already exists by ID
      if (album.id) {
        const existingAlbum = await this.findById(album.id, false);
        if (existingAlbum) {
          return existingAlbum;
        }
      }

      // Generate UUID if it doesn't exist
      const dataToCreate = {
        ...album,
        id: album.id || uuidv4().split("-")[0],
      };

      const createdAlbum = AlbumModel.create(dataToCreate);
      await createdAlbum.save();
      return createdAlbum as unknown as Album;
    }, "Failed to create album");
  }

  async update(id: string, data: Partial<Album>): Promise<Album> {
    const validatedId = this.validateId(id, "Album ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const result = await AlbumModel.update({ id: validatedId }, data);

      this.ensureAffected(
        result.affected || 0,
        `Album with ID ${id} not found`
      );

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
      const result = await AlbumModel.delete({ id: validatedId });

      this.ensureAffected(
        result.affected || 0,
        `Album with ID ${id} not found`
      );
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
        return existingRelation as any;
      }

      // Create new relation
      const newRelation = AlbumArtistModel.create({
        id: uuidv4().split("-")[0],
        artistId: validated.artistId,
        albumId: validated.albumId,
      });
      await newRelation.save();

      return newRelation as any;
    }, `Failed to add artist ${artistId} to album ${albumId}`);
  }

  async removeArtistFromAlbum(
    artistId: string,
    albumId: string
  ): Promise<void> {
    const validated = this.validateIds({ artistId, albumId });

    await this.handleRepositoryError(async () => {
      const result = await AlbumArtistModel.delete({
        artistId: validated.artistId,
        albumId: validated.albumId,
      });

      this.ensureAffected(
        result.affected || 0,
        `Relation between artist ${artistId} and album ${albumId} not found`
      );
    }, `Failed to remove artist ${artistId} from album ${albumId}`);
  }
}
