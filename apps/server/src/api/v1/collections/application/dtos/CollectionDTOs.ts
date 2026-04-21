import type { LibraryItem } from '@seerial/domain';

export interface CollectionSummaryDTO {
  id: string;
  title: string;
}

export interface ReorderItemDTO {
  id: string;
  type: 'movie' | 'movies' | 'series' | 'show' | 'shows' | 'album' | 'albums';
}

export interface MusicExtrasDTO {
  title: string;
  src: string;
  type: string;
}

export interface ReorderContentDTO {
  orderedItems: ReorderItemDTO[];
}

export interface CollectionContentDTO {
  movies: LibraryItem[];
  series: LibraryItem[];
  albums: LibraryItem[];
}

export interface UpdateCollectionDTO {
  title?: string;
  description?: string;
  backgroundSrc?: string;
  backgroundsUrls?: string[];
  coverSrc?: string;
  coversUrls?: string[];
  musicPosterSrc?: string;
}

export interface CreateCollectionWithItemDTO {
  title: string;
  description?: string;
  movieId?: string;
  seriesId?: string;
  albumId?: string;
}
