import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
import { IncludeType } from "@/types/common";
import { SeriesRepositoryPort } from "../../../application/ports/SeriesRepositoryPort";
import { Series } from "../../../domain/Series";
import { SeriesModel } from "../models/SeriesModel";

export class SeriesRepositoryImpl
  extends BaseRepository
  implements SeriesRepositoryPort
{
  private helper: GenericRepositoryHelper<SeriesModel, Series>;

  // Predefined relation sets for reusability
  private readonly RELATIONS = {
    all: [
      "seasons",
      "seasons.episodes",
      "seasons.episodes.video",
      "seasons.episodes.video.watchLists",
      "watchLists",
    ],
    few: ["seasons", "watchLists"],
    none: [],
  };

  constructor() {
    super();

    this.helper = new GenericRepositoryHelper(SeriesModel, {
      entityName: "Series",
      generateShortId: true,
    });
  }

  async findAll(libraryId: string): Promise<Series[]> {
    const validatedId = this.validateId(libraryId, "Library ID");
    return this.helper.findManyByField("libraryId", validatedId);
  }

  async findById(
    id: string,
    include: IncludeType = "none"
  ): Promise<Series | null> {
    const validatedId = this.validateId(id, "Series ID");

    return this.helper.findById(validatedId, {
      relations: this.RELATIONS[include],
    });
  }

  async create(series: Partial<Series>): Promise<Series> {
    this.validateData(series, "Series data");
    return this.helper.create(series, true);
  }

  async update(id: string, data: Partial<Series>): Promise<Series> {
    const validatedId = this.validateId(id, "Series ID");
    this.validateData(data, "Update data");
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Series ID");
    return this.helper.delete(validatedId);
  }
}
