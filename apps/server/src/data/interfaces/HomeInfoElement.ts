import type { Episode } from 'moviedb-promise';
import type { Library } from '@/api/v1/libraries/domain/Library';
import type { Season } from '@/api/v1/seasons/domain/Season';
import type { Series } from '@/api/v1/series/domain/Series';

export interface HomeInfoElement {
  library: Library;
  show: Series;
  season: Season;
  episode: Episode;
}
