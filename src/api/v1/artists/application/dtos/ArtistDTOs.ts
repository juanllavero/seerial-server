export interface CreateArtistDTO {
  name: string;
}

export interface UpdateArtistDTO {
  name?: string;
}

export interface ArtistResponse {
  status: string;
  message: string;
  data?: any;
}
