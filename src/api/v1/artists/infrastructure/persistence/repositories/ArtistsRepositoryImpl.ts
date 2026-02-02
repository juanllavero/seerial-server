import { Artist } from "@/api/v1/artists/domain/Artist";
import { ArtistModel } from "@/api/v1/artists/infrastructure/persistence/models/ArtistModel";
import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { ArtistsRepositoryPort } from "../../../application/ports/ArtistsRepositoryPort";

const artistsRepositoryLogger = logger.child({
  category: "Artists Repository",
});

export class ArtistsRepositoryImpl
  extends BaseRepository
  implements ArtistsRepositoryPort
{
  async getById(id: string): Promise<Artist | null> {
    const validatedId = this.validateId(id, "Artist ID");

    return this.handleRepositoryError(async () => {
      const artist = await ArtistModel.findOne({
        where: { id: validatedId },
        relations: ["albums"],
      });

      return artist ? (artist as unknown as Artist) : null;
    }, `Failed to retrieve artist with ID ${id}`);
  }

  async add(artistData: Partial<Artist>): Promise<Artist | null> {
    this.validateData(artistData, "Artist data");

    return this.handleRepositoryError(async () => {
      // Avoid duplicates
      if (artistData.name) {
        const existing = await ArtistModel.findOne({
          where: { name: artistData.name },
        });
        if (existing) return existing as unknown as Artist;
      }

      const newArtistData = {
        ...artistData,
        id: artistData.id || uuidv4().split("-")[0],
      };

      const artist = ArtistModel.create(newArtistData);
      await artist.save();
      return artist as unknown as Artist;
    }, "Failed to create artist");
  }

  async update(id: string, data: Partial<Artist>): Promise<Artist> {
    const validatedId = this.validateId(id, "Artist ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const result = await ArtistModel.update({ id: validatedId }, data);

      this.ensureAffected(
        result.affected || 0,
        `Artist with ID ${id} not found`
      );

      const updated = await this.getById(id);
      if (!updated) {
        throw new Error(`Failed to retrieve updated artist with ID ${id}`);
      }

      return updated;
    }, `Failed to update artist with ID ${id}`);
  }

  async delete(id: string): Promise<boolean> {
    const validatedId = this.validateId(id, "Artist ID");

    return this.handleRepositoryError(async () => {
      const result = await ArtistModel.delete({ id: validatedId });

      this.ensureAffected(
        result.affected || 0,
        `Artist with ID ${id} not found`
      );
      return true;
    }, `Failed to delete artist with ID ${id}`);
  }
}
