import { Movie, Series } from './Media';

export interface MyListItem {
  id: number;
  addedAt: string;
  series?: Series;
  movie?: Movie;
}

export interface PlayList {
  id: string;
  title: string;
  description?: string;
}
