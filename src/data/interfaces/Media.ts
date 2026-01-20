import { Album } from "@/api/v1/albums/domain/Album";
import { Collection } from "@/api/v1/collections/domain/Collection";
import { Movie } from "@/api/v1/movies/domain/Movie";
import { Series } from "@/api/v1/series/domain/Series";

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
  type: string;
  order: number;
  data: Collection | Series | Movie | Album | CollectionData | FlatItem;
  remainingItems?: number;
}
