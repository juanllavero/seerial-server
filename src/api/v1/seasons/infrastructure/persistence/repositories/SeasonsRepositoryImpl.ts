import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import { v4 as uuidv4 } from "uuid";
import { SeasonsRepositoryPort } from "../../../application/ports/SeasonsRepositoryPort";
import { Season } from "../../../domain/Season";
import { SeasonModel } from "../models/SeasonModel";

export class SeasonsRepositoryImpl
  extends BaseRepository
  implements SeasonsRepositoryPort
{
  async findAll(seriesId: string): Promise<Season[]> {
    const validatedSeriesId = this.validateId(seriesId, "Series ID");

    return this.handleRepositoryError(async () => {
      const seasons = await SeasonModel.findAll({
        where: { seriesId: validatedSeriesId },
      });

      return seasons.map((season) => season.toJSON());
    }, `Failed to retrieve seasons for series with ID ${seriesId}`);
  }

  async findById(id: string, include = "none"): Promise<Season | null> {
    const validatedId = this.validateId(id, "Season ID");

    return this.handleRepositoryError(async () => {
      const includeFew = [{ model: EpisodeModel, as: "episodes" }];
      const includeAll = [
        {
          model: EpisodeModel,
          as: "episodes",
          include: [
            {
              model: VideoModel,
              as: "video",
              include: [
                {
                  model: WatchListModel,
                  as: "watchLists",
                },
              ],
            },
          ],
        },
        {
          model: WatchListModel,
          as: "watchLists",
        },
      ];

      const season = await SeasonModel.findByPk(validatedId, {
        include:
          include === "few" ? includeFew : include === "all" ? includeAll : [],
      });

      return season ? season.toJSON() : null;
    }, `Failed to retrieve season with ID ${id}`);
  }

  async findSeasonsBySeriesId(seriesId: string): Promise<Season[]> {
    return this.handleRepositoryError(async () => {
      const seasons = await SeasonModel.findAll({
        where: { seriesId },
      });
      return seasons ? seasons.map((season) => season.toJSON()) : [];
    }, `Failed to retrieve seasons for series with ID ${seriesId}`);
  }

  async create(data: Partial<Season>): Promise<Season> {
    this.validateData(data, "Album data");

    return this.handleRepositoryError(async () => {
      // Check if season already exists by ID
      if (data.id) {
        const existingSeason = await this.findById(data.id);
        if (existingSeason) {
          console.log(`Season with ID ${data.id} already exists`);
          return existingSeason;
        }
      }

      // Generate UUID if it doesn't exist
      const dataToCreate = {
        ...data,
        id: data.id || uuidv4().split("-")[0],
      };

      const createdSeason = await AlbumModel.create(dataToCreate as any);
      return createdSeason.toJSON();
    }, "Failed to create season");
  }

  async update(id: string, data: Partial<Season>): Promise<Season> {
    const validatedId = this.validateId(id, "Season ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const [affectedCount] = await SeasonModel.update(data as any, {
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Season with ID ${id} not found`);

      const updatedSeason = await this.findById(id);
      if (!updatedSeason) {
        throw new Error(`Failed to retrieve updated season with ID ${id}`);
      }

      return updatedSeason;
    }, `Failed to update season with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Season ID");

    await this.handleRepositoryError(async () => {
      const affectedCount = await SeasonModel.destroy({
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Season with ID ${id} not found`);
    }, `Failed to delete season with ID ${id}`);
  }
}
