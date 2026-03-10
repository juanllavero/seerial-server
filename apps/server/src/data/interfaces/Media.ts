export interface CastData {
  name: string;
  character: string;
  profileImage: string;
}

export interface CollectionData {
  id: string;
  title: string;
  images: {
    poster?: string | null;
    background?: string | null;
    images: string[];
  };
  musicPosterSrc?: string;
  numberOfItems: number;
}

export interface FlatItem {
  id: string;
  year?: string;
  title: string;
  posterSrc: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  years?: string;
  coverSrc?: string;
  backgroundSrc?: string;
  numberOfItems: number;

  order: number;
  watched: boolean;
  remainingItems: number;
  analyzingFiles: boolean;

  type: ItemType;
}

export type ItemType = 'series' | 'movie' | 'album' | 'collection';

export enum LibraryTypes {
  SHOWS = 'Shows',
  MOVIES = 'Movies',
  MUSIC = 'Music',
}

export type LibraryType = 'Shows' | 'Movies' | 'Music';
