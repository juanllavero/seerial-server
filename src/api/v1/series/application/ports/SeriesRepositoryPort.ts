import { IncludeType } from "@/types/common";
import { Series } from "../../domain/Series";

export interface SeriesRepositoryPort {
  findAll(libraryId: string): Promise<Series[]>;
  findById(id: string, include?: IncludeType): Promise<Series | null>;
  create(series: Partial<Series>): Promise<Series>;
  update(id: string, series: Partial<Series>): Promise<Series>;
  delete(id: string): Promise<void>;
}
