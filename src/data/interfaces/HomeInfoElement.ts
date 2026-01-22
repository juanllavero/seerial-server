import { Library } from "@/api/v1/libraries/domain/Library";
import { Season } from "@/api/v1/seasons/domain/Season";
import { Series } from "@/api/v1/series/domain/Series";
import { Episode } from "moviedb-promise";

export interface HomeInfoElement {
  library: Library;
  show: Series;
  season: Season;
  episode: Episode;
}
