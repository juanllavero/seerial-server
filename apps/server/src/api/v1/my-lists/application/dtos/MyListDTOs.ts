import type { Movie } from '@/api/v1/movies/domain/Movie';
import type { Series } from '@/api/v1/series/domain/Series';

export interface MyListMoviesDTO {
  movies: Movie[];
}

export interface MyListSeriesDTO {
  series: Series[];
}
