import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

export interface UpdateAlbumDTO {
  title?: string;
  year?: string;
  genres?: string[];
  folder?: string;
  description?: string;
  coverSrc?: string;
}

export interface AlbumResponse extends ApiResponse {}
