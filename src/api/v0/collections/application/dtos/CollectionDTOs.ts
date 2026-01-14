import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

export interface ReorderItemDTO {
  id: string;
  type: "movie" | "movies" | "series" | "show" | "shows" | "album" | "albums";
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

export interface CollectionResponse extends ApiResponse {}
