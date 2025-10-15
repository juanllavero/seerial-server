import { AlbumData } from "@/api/v0/albums/albums.types";
import { MovieData } from "@/api/v0/movies/movies.types";
import { SeriesData } from "@/api/v0/series/series.types";

export interface CollectionData {
  id: string;
  title: string;
  description?: string;
  backgroundSrc: string;
  backgroundsUrls: string[];
  coverSrc: string;
  coversUrls: string[];

  shows: SeriesData[];
  movies: MovieData[];
  albums: AlbumData[];
}
