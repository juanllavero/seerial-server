import { IncludeType } from "@/types/common";
import { Season } from "../../domain/Season";

export interface SeasonsRepositoryPort {
  findAll(seriesId: string): Promise<Season[]>;
  findById(id: string, include?: IncludeType): Promise<Season | null>;
  findSeasonsBySeriesId(seriesId: string): Promise<Season[]>;
  create(season: Partial<Season>): Promise<Season>;
  update(id: string, album: Partial<Season>): Promise<Season>;
  delete(id: string): Promise<void>;
}
