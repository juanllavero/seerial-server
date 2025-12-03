import { AlbumModel } from "@/api/v0/albums/infrastructure/persistence/models/AlbumModel";
import { Artist } from "@/api/v0/artists/domain/Artist";
import { ArtistModel } from "@/api/v0/artists/infrastructure/persistence/models/ArtistModel";
import { v4 as uuidv4 } from "uuid";
import { ArtistsRepositoryPort } from "../../../application/ports/ArtistsRepositoryPort";
import { ArtistData } from "../../../artists.types";

export class ArtistsRepositoryImpl implements ArtistsRepositoryPort {
  async getById(id: string): Promise<Artist | null> {
    const artist = await ArtistModel.findByPk(id, {
      include: [{ model: AlbumModel, as: "albums" }],
    });

    if (!artist) return null;

    return artist.toJSON() as Artist;
  }

  async add(artistData: Partial<ArtistData>): Promise<Artist | null> {
    try {
      // Avoid duplicates
      if (artistData.name) {
        const existing = await ArtistModel.findOne({
          where: { name: artistData.name },
        });
        if (existing) return existing.toJSON() as Artist;
      }

      const newArtistData = {
        ...artistData,
        id: uuidv4().split("-")[0],
      };

      const artist = await ArtistModel.create(newArtistData as any);
      return artist.toJSON() as Artist;
    } catch (error) {
      console.error("Error creating artist:", error);
      return null;
    }
  }

  async update(id: string, data: Partial<ArtistData>): Promise<Artist> {
    const [affected] = await ArtistModel.update(data, { where: { id } });
    if (affected === 0) {
      throw new Error(`Artist with ID ${id} not found`);
    }

    const updated = await ArtistModel.findByPk(id, {
      include: [{ model: AlbumModel, as: "albums" }],
    });
    if (!updated) {
      throw new Error(`Failed to retrieve updated artist with ID ${id}`);
    }

    return updated.toJSON() as Artist;
  }

  async delete(id: string): Promise<boolean> {
    const affected = await ArtistModel.destroy({ where: { id } });
    if (affected === 0) {
      throw new Error(`Artist with ID ${id} not found`);
    }
    return true;
  }
}
