export interface ReorderItemDTO {
  id: string;
  type: "movie" | "movies" | "series" | "show" | "shows" | "album" | "albums";
}

export interface MusicExtrasDTO {
  [key: string]: any;
}
