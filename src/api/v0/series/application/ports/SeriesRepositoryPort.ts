import { IncludeType } from "@/utils/utils";
import { Series } from "../../domain/Series";

export interface SeriesRepositoryPort {
  findAll(libraryId: string): Promise<Series[]>;
  findById(id: string, include?: IncludeType): Promise<Series | null>;
  create(series: Series): Promise<Series>;
  update(id: string, series: Partial<Series>): Promise<Series>;
  delete(id: string): Promise<void>;
}
