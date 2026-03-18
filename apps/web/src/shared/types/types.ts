import type { Album, Movie, Series } from '@seerial/domain';

type DisplayCollections = 'collectionsAndElements' | 'onlyCollections' | 'onlyElements';

type ContentType = 'Music' | 'Shows' | 'Movies';
type CollectionKey = keyof CollectionItems;
type CollectionItems = {
  albums: Album[];
  movies: Movie[];
  shows: Series[];
};

export type { DisplayCollections, CollectionKey, CollectionItems, ContentType };
