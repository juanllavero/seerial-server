import type { Movie } from '../../movies/domain/Movie';
import type { Series } from '../../series/domain/Series';

export interface MyListItem {
  id: number;
  addedAt: string;
  series?: Series;
  movie?: Movie;
}
