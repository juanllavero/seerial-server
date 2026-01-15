import { Movie } from "@/api/v1/movies/domain/Movie";
import { Series } from "@/api/v1/series/domain/Series";
import { MyListItem } from "../../domain/MyList";

export interface MyListRepositoryPort {
  // Add
  addMovieToMyList: (
    movieId: string,
    userId: string
  ) => Promise<MyListItem | null>;
  addSeriesToMyList: (
    seriesId: string,
    userId: string
  ) => Promise<MyListItem | null>;

  // Remove
  removeMovieFromMyList: (movieId: string, userId: string) => Promise<void>;
  removeSeriesFromMyList: (seriesId: string, userId: string) => Promise<void>;
  removeItemFromMyList: (itemId: string) => Promise<void>;

  // Get
  getMoviesFromMyList: (userId: string) => Promise<Movie[]>;
  getSeriesFromMyList: (userId: string) => Promise<Series[]>;

  isMovieInMyList: (movieId: string, userId: string) => Promise<boolean>;
  isSeriesInMyList: (seriesId: string, userId: string) => Promise<boolean>;
}
