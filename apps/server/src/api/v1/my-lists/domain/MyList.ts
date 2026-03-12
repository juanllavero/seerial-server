import type { Movie } from '../../movies/domain/Movie';
import type { Series } from '../../series/domain/Series';

export interface MyListItem {
  id: string;
  addedAt: Date;
  series?: Series;
  movie?: Movie;
}
