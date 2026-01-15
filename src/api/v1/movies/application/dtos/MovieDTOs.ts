export interface RefreshMetadataDTO {
  id: string;
}

export interface ChangeIdentificationDTO {
  themdbId: number;
}

export interface UpdateMovieDTO {
  title?: string;
  releaseDate?: string;
  overview?: string;
  // ... otros campos que permites actualizar
}

export interface SetMovieWatchStateDTO {
  watched: boolean;
}

export interface MovieResponse {
  status: string;
  message: string;
  data?: any;
}
