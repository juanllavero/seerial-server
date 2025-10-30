import { Album } from "@/api/v0/albums/domain/Album";
import { Collection } from "@/api/v0/collections/domain/Collection";
import { Movie } from "@/api/v0/movies/domain/Movie";
import { Series } from "@/api/v0/series/domain/Series";

export interface Cast {
  name: string;
  character: string;
  profileImage: string;
}

export interface LibraryItem {
  type: string;
  order: number;
  data: Collection | Series | Movie | Album;
  remainingItems?: number;
}
