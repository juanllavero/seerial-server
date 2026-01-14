import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

export interface CreateArtistDTO {
  name: string;
}

export interface UpdateArtistDTO {
  name?: string;
}

export interface ArtistResponse extends ApiResponse {}
