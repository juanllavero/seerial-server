export interface UpdateAlbumDTO {
  title?: string;
  year?: string;
  genres?: string[];
  folder?: string;
  description?: string;
  coverSrc?: string;
}

export interface AlbumResponse {
  status: string;
  message: string;
  data?: any;
}
