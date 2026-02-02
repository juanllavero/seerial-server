import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import logger from "@/utils/logger";
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
      const seasons = await SeasonModel.find({
        where: { seriesId: validatedSeriesId },
      });

      return seasons.map((season) => season as unknown as Season);
    }, `Failed to retrieve seasons for series with ID ${seriesId}`);
  }

  async findById(id: string, include = "none"): Promise<Season | null> {
    const validatedId = this.validateId(id, "Season ID");

    return this.handleRepositoryError(async () => {
      const includeFew = ["episodes"];
      const includeAll = [
        "episodes",
        "episodes.video",
        "episodes.video.watchLists",
        "watchLists",
      ];

      const season = await SeasonModel.findOne({
        where: { id: validatedId },
        relations:
          include === "few" ? includeFew : include === "all" ? includeAll : [],
      });

      return season ? (season as unknown as Season) : null;
    }, `Failed to retrieve season with ID ${id}`);
  }

  async findSeasonsBySeriesId(seriesId: string): Promise<Season[]> {
    return this.handleRepositoryError(async () => {
      const seasons = await SeasonModel.find({
        where: { seriesId },
      });
      return seasons
        ? seasons.map((season) => season as unknown as Season)
        : [];
    }, `Failed to retrieve seasons for series with ID ${seriesId}`);
  }

  async create(data: Partial<Season>): Promise<Season> {
    this.validateData(data, "Album data");

    return this.handleRepositoryError(async () => {
      // Check if season already exists by ID
      if (data.id) {
        const existingSeason = await this.findById(data.id);
        if (existingSeason) {
          logger.info(`Season with ID ${data.id} already exists`);
          return existingSeason;
        }
      }

      // Generate UUID if it doesn't exist
      const dataToCreate = {
        ...data,
        id: data.id || uuidv4().split("-")[0],
      };

      const createdSeason = SeasonModel.create(dataToCreate);
      await createdSeason.save();
      return createdSeason as unknown as Season;
    }, "Failed to create season");
  }

  async update(id: string, data: Partial<Season>): Promise<Season> {
    const validatedId = this.validateId(id, "Season ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const result = await SeasonModel.update({ id: validatedId }, data);

      this.ensureAffected(
        result.affected || 0,
        `Season with ID ${id} not found`
      );

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
      const result = await SeasonModel.delete({ id: validatedId });

      this.ensureAffected(
        result.affected || 0,
        `Season with ID ${id} not found`
      );
    }, `Failed to delete season with ID ${id}`);
  }
}
