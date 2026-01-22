import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import { v4 as uuidv4 } from "uuid";
import { SeriesRepositoryPort } from "../../../application/ports/SeriesRepositoryPort";
import { Series } from "../../../domain/Series";
import { SeriesModel } from "../models/SeriesModel";

export class SeriesRepositoryImpl
  extends BaseRepository
  implements SeriesRepositoryPort
{
  async findAll(libraryId: string): Promise<Series[]> {
    const validatedId = this.validateId(libraryId, "Library ID");

    return this.handleRepositoryError(async () => {
      const series = await SeriesModel.findAll({
        where: { libraryId: validatedId },
      });
      return series.map((s) => s.toJSON());
    }, `Failed to retrieve series for library ${libraryId}`);
  }

  async findById(id: string, include = "none"): Promise<Series | null> {
    const validatedId = this.validateId(id, "Series ID");

    return this.handleRepositoryError(async () => {
      const includeAll = [
        {
          model: SeasonModel,
          as: "seasons",
          include: [
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
          ],
        },
        {
          model: WatchListModel,
          as: "watchLists",
        },
      ];
      const includeFew = [
        {
          model: SeasonModel,
          as: "seasons",
        },
        {
          model: WatchListModel,
          as: "watchLists",
        },
      ];

      const series = await SeriesModel.findByPk(validatedId, {
        include:
          include === "few" ? includeFew : include === "all" ? includeAll : [],
      });

      return series ? series.toJSON() : null;
    }, `Failed to retrieve series with ID ${id}`);
  }

  async create(series: Partial<Series>): Promise<Series> {
    this.validateData(series, "Series data");

    return this.handleRepositoryError(async () => {
      // Check if series already exists by ID
      if (series.id) {
        const existingSeries = await this.findById(series.id, "none");
        if (existingSeries) {
          console.log(`Series with ID ${series.id} already exists`);
          return existingSeries;
        }
      }

      // Generate UUID if it doesn't exist
      const dataToCreate = {
        ...series,
        id: series.id || uuidv4().split("-")[0],
      };

      const createdSeries = await SeriesModel.create(dataToCreate as any);
      return createdSeries.toJSON();
    }, "Failed to create series");
  }

  async update(id: string, data: Partial<Series>): Promise<Series> {
    const validatedId = this.validateId(id, "Series ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const [affectedCount] = await SeriesModel.update(data as any, {
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Series with ID ${id} not found`);

      const updatedSeries = await this.findById(id, "none");
      if (!updatedSeries) {
        throw new Error(`Failed to retrieve updated series with ID ${id}`);
      }

      return updatedSeries;
    }, `Failed to update series with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Series ID");

    await this.handleRepositoryError(async () => {
      const affectedCount = await SeriesModel.destroy({
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Series with ID ${id} not found`);
    }, `Failed to delete series with ID ${id}`);
  }
}
