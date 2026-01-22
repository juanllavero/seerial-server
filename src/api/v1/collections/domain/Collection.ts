import { Album } from "../../albums/domain/Album";
import { Movie } from "../../movies/domain/Movie";
import { Series } from "../../series/domain/Series";

export interface Collection {
  id: string;
  title: string;
  description?: string;
  backgroundSrc: string;
  backgroundsUrls: string[];
  coverSrc: string;
  coversUrls: string[];

  numberOfItems?: number;
  musicPosterSrc?: string;

  shows: Series[];
  movies: Movie[];
  albums: Album[];
}
