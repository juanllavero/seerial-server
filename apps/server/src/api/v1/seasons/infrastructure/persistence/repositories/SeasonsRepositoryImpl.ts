import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { SeasonsRepositoryPort } from "../../../application/ports/SeasonsRepositoryPort";
import { Season } from "../../../domain/Season";
import { SeasonModel } from "../models/SeasonModel";

export class SeasonsRepositoryImpl
  extends BaseRepository
  implements SeasonsRepositoryPort
{
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<SeasonModel, Season>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(SeasonModel, {
      entityName: "Season",
      generateShortId: true,
    });
  }

  async findAll(seriesId: string): Promise<Season[]> {
    const validatedSeriesId = this.validateId(seriesId, "Series ID");
    return this.helper.findManyByField("seriesId", validatedSeriesId);
  }

  async findById(id: string, include = "none"): Promise<Season | null> {
    const validatedId = this.validateId(id, "Season ID");

    const includeFew = ["episodes"];
    const includeAll = [
      "episodes",
      "episodes.video",
      "episodes.video.watchLists",
      "watchLists",
    ];

    return this.helper.findById(validatedId, {
      relations:
        include === "few" ? includeFew : include === "all" ? includeAll : [],
    });
  }

  async findSeasonsBySeriesId(seriesId: string): Promise<Season[]> {
    return this.helper.findManyByField("seriesId", seriesId);
  }

  async create(data: Partial<Season>): Promise<Season> {
    this.validateData(data, "Album data");

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

    return this.helper.create(dataToCreate, true);
  }

  async update(id: string, data: Partial<Season>): Promise<Season> {
    const validatedId = this.validateId(id, "Season ID");
    this.validateData(data, "Update data");
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Season ID");
    return this.helper.delete(validatedId);
  }
}
