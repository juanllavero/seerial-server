export interface CreatePlayListDTO {
  title: string;
  description?: string;
}

export interface UpdatePlayListDTO {
  title?: string;
  description?: string;
}

export interface AddSongToPlaylistDTO {
  songId: string;
}

export interface PlayListResponse {
  status: string;
  message: string;
  data?: any;
}
