import { Library } from "@/api/v0/libraries/domain/Library";
import { Season } from "@/api/v0/seasons/domain/Season";
import { Series } from "@/api/v0/series/domain/Series";
import { Episode } from "moviedb-promise";

export interface HomeInfoElement {
  library: Library;
  show: Series;
  season: Season;
  episode: Episode;
}
