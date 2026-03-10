export interface ReorderItemDTO {
  id: string;
  type: 'movie' | 'movies' | 'series' | 'show' | 'shows' | 'album' | 'albums';
}

export interface MusicExtrasDTO {
  [key: string]: any;
}

export interface ReorderContentDTO {
  orderedItems: ReorderItemDTO[];
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
