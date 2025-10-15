import { EpisodeData } from "@/api/v0/episodes/episodes.types";
import { LibraryData } from "@/api/v0/libraries/libraries.types";
import { SeasonData } from "@/api/v0/seasons/seasons.types";
import { SeriesData } from "@/api/v0/series/series.types";

export interface HomeInfoElement {
  library: LibraryData;
  show: SeriesData;
  season: SeasonData;
  episode: EpisodeData;
}
