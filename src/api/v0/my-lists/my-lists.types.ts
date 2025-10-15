import { MovieData } from "@/api/v0/movies/movies.types";
import { SeriesData } from "@/api/v0/series/series.types";

export interface MyListItem {
  id: number;
  addedAt: string;
  series?: SeriesData;
  movie?: MovieData;
}
